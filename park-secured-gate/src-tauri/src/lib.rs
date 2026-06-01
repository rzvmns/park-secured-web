use ble_peripheral_rust::{
    gatt::{
        characteristic::Characteristic,
        peripheral_event::{PeripheralEvent, WriteRequestResponse, RequestResponse},
        properties::{AttributePermission, CharacteristicProperty},
        service::Service,
    },
    uuid::ShortUuid,
    Peripheral, PeripheralImpl,
};
use tokio::sync::mpsc;
use uuid::Uuid;
use tauri::{AppHandle, Emitter};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::time::{Instant, Duration};

const PARKSECURED_SERVICE_UUID: u16 = 0xABCD;
const PARKSECURED_CHAR_UUID: u16 = 0x1234;

// Debounce: ignoră același cod bluetooth dacă vine din nou în mai puțin de 15 secunde
const DEBOUNCE_SECS: u64 = 15;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                start_ble_peripheral(handle).await;
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn start_ble_peripheral(app: AppHandle) {
    let service_uuid = Uuid::from_short(PARKSECURED_SERVICE_UUID);
    let char_uuid = Uuid::from_short(PARKSECURED_CHAR_UUID);

    let service = Service {
        uuid: service_uuid,
        primary: true,
        characteristics: vec![
            Characteristic {
                uuid: char_uuid,
                properties: vec![CharacteristicProperty::Write],
                permissions: vec![AttributePermission::Writeable],
                value: None,
                descriptors: vec![],
            }
        ],
    };

    let (tx, mut rx) = mpsc::channel::<PeripheralEvent>(256);
    let mut peripheral = Peripheral::new(tx).await.unwrap();

    while !peripheral.is_powered().await.unwrap() {}
    println!("BLE pornit.");

    peripheral.add_service(&service).await.unwrap();
    peripheral.start_advertising("ParkSecured", &[service_uuid]).await.unwrap();
    println!("BLE advertising pornit — aștept bluetoothCode de la telefon...");

    // Debounce map: bluetooth_code -> ultima dată când a fost procesat
    let debounce_map: Arc<Mutex<HashMap<String, Instant>>> = Arc::new(Mutex::new(HashMap::new()));

    while let Some(event) = rx.recv().await {
        match event {
            PeripheralEvent::WriteRequest { value, responder, .. } => {
                let bluetooth_code = String::from_utf8(value).unwrap_or_default();
                println!("Primit bluetoothCode: {}", bluetooth_code);

                // Verifică debounce — dacă același cod a fost primit recent, ignorăm
                let should_process = {
                    let mut map = debounce_map.lock().unwrap();
                    let now = Instant::now();
                    let debounce_duration = Duration::from_secs(DEBOUNCE_SECS);

                    if let Some(&last_time) = map.get(&bluetooth_code) {
                        if now.duration_since(last_time) < debounce_duration {
                            println!("Debounce: ignorat cod duplicat '{}' ({}s de la ultimul)", 
                                bluetooth_code, 
                                now.duration_since(last_time).as_secs());
                            false
                        } else {
                            map.insert(bluetooth_code.clone(), now);
                            true
                        }
                    } else {
                        map.insert(bluetooth_code.clone(), now);
                        true
                    }
                };

                if should_process {
                    let app_clone = app.clone();
                    let code = bluetooth_code.clone();
                    tauri::async_runtime::spawn(async move {
                        match validate_bluetooth_code(&code).await {
                            Ok(result) => {
                                let _ = app_clone.emit("bluetooth-access-result", result);
                            }
                            Err(e) => {
                                eprintln!("Eroare validare: {}", e);
                                // Nu emitem nimic la eroare — frontul nu trebuie să afișeze nimic
                            }
                        }
                    });
                }

                responder.send(WriteRequestResponse {
                    response: RequestResponse::Success,
                }).unwrap();
            }
            _ => {}
        }
    }
}

// Returnează serde_json::Value în loc de String —
// Tauri îl serializează corect ca obiect JSON, nu ca string dublu-encodat
async fn validate_bluetooth_code(bluetooth_code: &str) -> Result<serde_json::Value, String> {
    let cloud_url = "https://park-secured-cloud-r62j.onrender.com/api";

    let client = reqwest::Client::new();
    let res = client
        .post(format!("{}/gate/validate-bluetooth", cloud_url))
        .header("x-gate-api-key", "cheie123")
        .json(&serde_json::json!({ "bluetoothCode": bluetooth_code }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(json)
}

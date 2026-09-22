use serde::Serialize;
use serialport::{available_ports, DataBits, FlowControl, Parity, SerialPort, StopBits};
use std::{io::ErrorKind, sync::Mutex, time::Duration};

struct SerialState(Mutex<Option<Box<dyn SerialPort>>>);

#[derive(Serialize)]
struct PortInfo {
    name: String,
    description: String,
}

fn with_port<T>(
    state: &tauri::State<'_, SerialState>,
    action: impl FnOnce(&mut dyn SerialPort) -> Result<T, String>,
) -> Result<T, String> {
    let mut guard = state
        .0
        .lock()
        .map_err(|_| "シリアルポートのロックに失敗しました".to_string())?;
    let port = guard
        .as_deref_mut()
        .ok_or_else(|| "シリアルポートが接続されていません".to_string())?;
    action(port)
}

#[tauri::command]
fn list_serial_ports() -> Result<Vec<PortInfo>, String> {
    available_ports()
        .map(|ports| {
            ports
                .into_iter()
                .map(|port| PortInfo {
                    name: port.port_name,
                    description: format!("{:?}", port.port_type),
                })
                .collect()
        })
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn open_serial_port(
    state: tauri::State<'_, SerialState>,
    port_name: String,
    baud_rate: u32,
) -> Result<(), String> {
    let port = serialport::new(port_name, baud_rate)
        .timeout(Duration::from_millis(20))
        .data_bits(DataBits::Eight)
        .parity(Parity::None)
        .stop_bits(StopBits::One)
        .flow_control(FlowControl::None)
        .open()
        .map_err(|error| error.to_string())?;
    *state
        .0
        .lock()
        .map_err(|_| "シリアルポートのロックに失敗しました".to_string())? = Some(port);
    Ok(())
}

#[tauri::command]
fn close_serial_port(state: tauri::State<'_, SerialState>) -> Result<(), String> {
    *state
        .0
        .lock()
        .map_err(|_| "シリアルポートのロックに失敗しました".to_string())? = None;
    Ok(())
}

#[tauri::command]
fn write_serial(state: tauri::State<'_, SerialState>, data: Vec<u8>) -> Result<usize, String> {
    with_port(&state, |port| {
        port.write_all(&data).map_err(|error| error.to_string())?;
        port.flush().map_err(|error| error.to_string())?;
        Ok(data.len())
    })
}

#[tauri::command]
fn read_serial(state: tauri::State<'_, SerialState>) -> Result<Vec<u8>, String> {
    with_port(&state, |port| {
        let count = port
            .bytes_to_read()
            .map_err(|error| error.to_string())?
            .min(4096) as usize;
        if count == 0 {
            return Ok(Vec::new());
        }
        let mut buffer = vec![0; count];
        match port.read(&mut buffer) {
            Ok(read) => {
                buffer.truncate(read);
                Ok(buffer)
            }
            Err(error) if error.kind() == ErrorKind::TimedOut => Ok(Vec::new()),
            Err(error) => Err(error.to_string()),
        }
    })
}

#[tauri::command]
fn set_serial_signal(
    state: tauri::State<'_, SerialState>,
    signal: String,
    high: bool,
) -> Result<(), String> {
    with_port(&state, |port| match signal.as_str() {
        "rts" => port
            .write_request_to_send(high)
            .map_err(|error| error.to_string()),
        "dtr" => port
            .write_data_terminal_ready(high)
            .map_err(|error| error.to_string()),
        // Serial APIs do not expose TX as a modem-control line. BREAK forces TX low;
        // clearing it returns the line to its normal idle-high condition.
        "tx" if high => port.clear_break().map_err(|error| error.to_string()),
        "tx" => port.set_break().map_err(|error| error.to_string()),
        _ => Err("未対応の信号です".to_string()),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(SerialState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            list_serial_ports,
            open_serial_port,
            close_serial_port,
            write_serial,
            read_serial,
            set_serial_signal
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

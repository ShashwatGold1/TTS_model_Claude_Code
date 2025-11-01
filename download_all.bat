@echo off
echo ============================================
echo   Downloading TTS Voice Models
echo ============================================
echo.

echo Creating models directory...
if not exist "models" mkdir models

echo.
echo [1/10] Downloading Lessac model file (220MB)...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx' -OutFile 'models/en_US-lessac-high.onnx'"
echo [1/10] Done

echo.
echo [2/10] Downloading Lessac config...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx.json' -OutFile 'models/en_US-lessac-high.onnx.json'"
echo [2/10] Done

echo.
echo [3/10] Downloading Amy model file (60MB)...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx' -OutFile 'models/en_US-amy-medium.onnx'"
echo [3/10] Done

echo.
echo [4/10] Downloading Amy config...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json' -OutFile 'models/en_US-amy-medium.onnx.json'"
echo [4/10] Done

echo.
echo [5/10] Downloading LJSpeech model file (200MB)...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/high/en_US-ljspeech-high.onnx' -OutFile 'models/en_US-ljspeech-high.onnx'"
echo [5/10] Done

echo.
echo [6/10] Downloading LJSpeech config...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/high/en_US-ljspeech-high.onnx.json' -OutFile 'models/en_US-ljspeech-high.onnx.json'"
echo [6/10] Done

echo.
echo [7/10] Downloading Kathleen model file (15MB)...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kathleen/low/en_US-kathleen-low.onnx' -OutFile 'models/en_US-kathleen-low.onnx'"
echo [7/10] Done

echo.
echo [8/10] Downloading Kathleen config...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kathleen/low/en_US-kathleen-low.onnx.json' -OutFile 'models/en_US-kathleen-low.onnx.json'"
echo [8/10] Done

echo.
echo [9/10] Downloading LibriTTS model file (70MB)...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx' -OutFile 'models/en_US-libritts_r-medium.onnx'"
echo [9/10] Done

echo.
echo [10/10] Downloading LibriTTS config...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx.json' -OutFile 'models/en_US-libritts_r-medium.onnx.json'"
echo [10/10] Done

echo.
echo ============================================
echo   All models downloaded successfully!
echo ============================================
echo.
echo You can now run: npm start
echo.
pause

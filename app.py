from flask import Flask, request, jsonify, render_template, redirect, url_for, session, flash, current_app
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
from werkzeug.utils import secure_filename
import os
import google.generativeai as genai
from datetime import datetime
from dotenv import load_dotenv
from flask_pymongo import PyMongo

# Import database and MQTT modules
from db_operations import init_mongodb, is_db_available, update_curtain_data, log_voice_control, create_voice_notification
from mqtt_client import init_mqtt_client, is_mqtt_available, send_voice_command

# --- KONFIGURASI ---
load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "rahasia_default_dev") # Penting untuk session

# Konfigurasi Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("⚠️ PERINGATAN: GEMINI_API_KEY belum diatur di file .env")
else:
    genai.configure(api_key=GEMINI_API_KEY)

# Konfigurasi MongoDB
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
mongo = init_mongodb(app)

# Initialize MQTT client
mqtt_client = init_mqtt_client()

# --- 1. MEMBANGUN MODEL NLP (HARDCODED DATA) ---
# Data latih untuk kontrol gorden dengan variasi kesalahan transkripsi dan konteks situasional
data_latih = [
    # --- Perintah BUKA ---
    ("buka gorden", "BUKA"), ("buka tirai", "BUKA"), ("tolong buka", "BUKA"), ("buka en", "BUKA"),
    ("biarkan cahaya masuk", "BUKA"), ("gordennya dibuka", "BUKA"), ("bukain gordennya", "BUKA"),
    ("singkapkan tirai", "BUKA"), ("gorden buka sekarang", "BUKA"), ("buka yang lebar", "BUKA"),
    ("tarik gordennya", "BUKA"), ("buka semua", "BUKA"), ("buka sedikit gorden", "BUKA"),
    ("saya ingin lihat pemandangan", "BUKA"), ("biar terang", "BUKA"), ("aku mau terang", "BUKA"),
    ("saya sudah sampai rumah", "BUKA"), ("gelap", "BUKA"), ("selamat pagi", "BUKA"), ("saya sudah bangun", "BUKA"), ("ruangan saya gelap", "BUKA"),
    
    # Konteks situasional BUKA
    ("bangun", "BUKA"), ("pagi", "BUKA"), ("siang", "BUKA"), ("baru bangun", "BUKA"),
    ("terang", "BUKA"), ("gelap banget", "BUKA"), ("kurang terang", "BUKA"), ("kurang cahaya", "BUKA"),
    ("butuh cahaya", "BUKA"), ("cahaya dong", "BUKA"), ("lihat luar", "BUKA"), ("view", "BUKA"),
    ("sinar matahari", "BUKA"), ("matahari keluar", "BUKA"), ("cerah", "BUKA"), ("seger", "BUKA"),
    ("angin masuk", "BUKA"), ("kering", "BUKA"), ("pengap", "BUKA"), ("lembap", "BUKA"),
    ("gerah", "BUKA"), ("sumuk", "BUKA"), ("abu", "BUKA"), ("debu", "BUKA"),
    ("hawanya pengap", "BUKA"), ("ruangan gelap", "BUKA"), ("terlalu redup", "BUKA"),
    ("mendung tapi gelap", "BUKA"), ("terangin", "BUKA"), ("fresh", "BUKA"), ("open", "BUKA"), ("light", "BUKA"),
    
    # Kalimat panjang dengan konteks BUKA
    ("aku baru bangun nih", "BUKA"), ("ruangan gelap banget", "BUKA"), ("pengap banget ruanganku", "BUKA"),
    ("gelap banget di sini", "BUKA"), ("butuh cahaya nih", "BUKA"), ("aku mau lihat pemandangan", "BUKA"),
    ("hawanya pengap banget", "BUKA"), ("ruanganku gelap", "BUKA"), ("aku butuh cahaya", "BUKA"),
    ("wah gelap banget", "BUKA"), ("wah gelap banget di sini", "BUKA"), ("gelap nih", "BUKA"),
    ("ruanganku pengap nih", "BUKA"), ("pagi hari yang cerah", "BUKA"),
    
    # Variasi kesalahan transkripsi untuk BUKA
    ("buka tilai", "BUKA"), ("buka lirai", "BUKA"), ("buka gulai", "BUKA"), ("buka golden", "BUKA"),
    ("buka gordyn", "BUKA"), ("buka korden", "BUKA"), ("bukain tilai", "BUKA"), ("bukain lirai", "BUKA"),
    
    # --- Perintah TUTUP ---
    ("tutup gorden", "TUTUP"), ("tutup tirai", "TUTUP"), ("silau", "TUTUP"), ("tutup en", "TUTUP"), ("tutuppen", "TUTUP"), ("tutup an", "TUTUP"),
    ("silau banget", "TUTUP"), ("terlalu silau", "TUTUP"), ("terlalu terang", "TUTUP"),
    ("saya mau tidur", "TUTUP"), ("aku pergi", "TUTUP"), ("tutupin gordennya", "TUTUP"),
    ("tutup sekarang", "TUTUP"), ("gelapkan ruangan", "TUTUP"), ("gordennya ditutup", "TUTUP"),
    ("tutup rapat gorden", "TUTUP"), ("saya mau privasi", "TUTUP"), ("sudah malam", "TUTUP"),
    ("tutup semua tirai", "TUTUP"), ("selamat malam", "TUTUP"),
    
    # Konteks situasional TUTUP
    ("tidur", "TUTUP"), ("ngantuk", "TUTUP"), ("malam", "TUTUP"), ("privasi", "TUTUP"),
    ("gelapin", "TUTUP"), ("mataharinya silau", "TUTUP"), ("terang banget", "TUTUP"),
    ("kepanasan", "TUTUP"), ("panas", "TUTUP"), ("cuacanya panas", "TUTUP"),
    ("dingin banget", "TUTUP"), ("angin kencang", "TUTUP"), ("privacy", "TUTUP"),
    ("sunset", "TUTUP"), ("sunrise", "TUTUP"), ("glare", "TUTUP"), ("relax", "TUTUP"), ("rest", "TUTUP"),
    ("dekat jalan", "TUTUP"), ("orang lewat", "TUTUP"), ("ada orang di luar", "TUTUP"),
    ("redup", "TUTUP"), ("reduce light", "TUTUP"), ("stop light", "TUTUP"), ("close", "TUTUP"), ("shaded", "TUTUP"),
    
    # Kalimat panjang dengan konteks TUTUP
    ("aku mau tidur nih", "TUTUP"), ("panas banget ruanganku", "TUTUP"), ("kepanasan banget", "TUTUP"),
    ("aku ngantuk nih", "TUTUP"), ("mau privasi dong", "TUTUP"), ("silau banget mataku", "TUTUP"),
    ("terang banget di sini", "TUTUP"), ("aku mau istirahat", "TUTUP"), ("ada orang lewat di luar", "TUTUP"),
    ("mataharinya silau banget", "TUTUP"), ("cuacanya panas banget", "TUTUP"), ("aku mau relax", "TUTUP"),
    ("silau banget", "TUTUP"), ("mataku silau", "TUTUP"), ("sudah malam nih", "TUTUP"),
    ("kepanasan aku di sini", "TUTUP"), ("wah silau", "TUTUP"),
    
    # Variasi kesalahan transkripsi untuk TUTUP
    ("tutup tilai", "TUTUP"), ("tutup lirai", "TUTUP"), ("tutup lilin", "TUTUP"), ("tutup gulai", "TUTUP"),
    ("tutup golden", "TUTUP"), ("tutup gordyn", "TUTUP"), ("tutup korden", "TUTUP"),
    ("tutupin tilai", "TUTUP"), ("tutupin lirai", "TUTUP"), ("tutupin lilin", "TUTUP"),

    # --- Variasi Singkat ---
    ("buka", "BUKA"), ("tutup", "TUTUP"), ("bukain", "BUKA"), ("tutupin", "TUTUP")
]

# Melatih Model saat server start
kalimat, label = zip(*data_latih)
model = make_pipeline(CountVectorizer(), MultinomialNB())
model.fit(kalimat, label)
print("✅ Model NLP Klasifikasi Intent Siap!")

# --- HELPER FUNCTION (INI YANG SEBELUMNYA HILANG) ---
def prediksi_intent(teks):
    """Fungsi helper untuk klasifikasi intent menggunakan Naive Bayes"""
    if not teks:
        return {'status': 'error', 'pesan': 'Tidak ada input teks'}

    # Prediksi
    prediksi = model.predict([teks])[0]
    
    try:
        probabilitas = float(np.max(model.predict_proba([teks])))
    except:
        probabilitas = 1.0

    # Logika Respon UI
    pesan_balik = ""
    status = "info"
    
    # Kata kunci yang HARUS ada untuk perintah valid dengan konteks situasional
    kata_kunci_buka = [
        # Perintah langsung
        'buka', 'bukain', 'singkap', 'tarik', 'terang', 'cahaya', 'bangun', 'gelap',
        # Konteks situasional BUKA
        'pagi', 'siang', 'baru bangun', 'kurang terang', 'kurang cahaya', 'butuh cahaya', 'cahaya dong',
        'lihat luar', 'view', 'sinar matahari', 'matahari keluar', 'cerah', 'seger', 'angin masuk',
        'kering', 'pengap', 'lembap', 'gerah', 'sumuk', 'abu', 'debu', 'hawanya pengap',
        'ruangan gelap', 'terlalu redup', 'mendung tapi gelap', 'terangin', 'fresh', 'open', 'light',
        'gelap banget'
    ]
    kata_kunci_tutup = [
        # Perintah langsung
        'tutup', 'tutupin', 'silau', 'tidur', 'pergi', 'privasi', 'malam', 'rapat',
        # Konteks situasional TUTUP
        'ngantuk', 'gelapin', 'mataharinya silau', 'terang banget', 'kepanasan', 'panas',
        'cuacanya panas', 'dingin banget', 'angin kencang', 'privacy', 'sunset', 'sunrise',
        'glare', 'relax', 'rest', 'dekat jalan', 'orang lewat', 'ada orang di luar',
        'redup', 'reduce light', 'stop light', 'close', 'shaded'
    ]
    kata_kunci_objek = ['gorden', 'tirai', 'gordyn', 'korden']
    
    # Konteks situasional sudah digabung ke kata_kunci_buka dan kata_kunci_tutup di atas
    # Tidak perlu list terpisah lagi
    
    # Kata-kata yang mirip dengan "tirai" atau "gorden" (kesalahan transkripsi umum)
    kata_mirip_tirai = ['tilai', 'tirai', 'tiray', 'tirei', 'tira', 'lirai', 'lilin', 'lira']
    kata_mirip_gorden = ['gorden', 'gordyn', 'korden', 'gordin', 'gulai', 'golden', 'garden']
    
    # Objek yang TIDAK boleh (blacklist) - hanya objek yang jelas bukan gorden
    # Note: "mata" dihapus karena bisa muncul dalam konteks "mataku silau" yang valid
    objek_blacklist = ['pintu', 'mulut', 'buku', 'jendela', 'lemari', 'tv', 'televisi', 'laptop', 'hp', 'komputer', 'mobil', 'motor']
    
    # Perintah singkat yang diizinkan tanpa objek (hanya 1 kata)
    perintah_singkat = ['buka', 'tutup', 'bukain', 'tutupin']
    
    teks_lower = teks.lower()
    teks_words = teks_lower.split()
    
    # Cek apakah ada kata kunci yang relevan (sudah termasuk konteks situasional)
    ada_kata_buka = any(kata in teks_lower for kata in kata_kunci_buka)
    ada_kata_tutup = any(kata in teks_lower for kata in kata_kunci_tutup)
    ada_kata_objek = any(kata in teks_lower for kata in kata_kunci_objek)
    ada_kata_mirip_tirai = any(kata in teks_lower for kata in kata_mirip_tirai)
    ada_kata_mirip_gorden = any(kata in teks_lower for kata in kata_mirip_gorden)
    ada_objek_blacklist = any(kata in teks_lower for kata in objek_blacklist)
    
    # Cek apakah ini perintah singkat (hanya 1 kata dari perintah_singkat)
    is_perintah_singkat = len(teks_words) == 1 and teks_words[0] in perintah_singkat
    
    # Cek apakah ini kata kunci konteks situasional (bisa di dalam kalimat panjang)
    # Tidak ada batasan jumlah kata, selama ada kata kunci kontekstual
    is_konteks_situasional = (ada_kata_buka or ada_kata_tutup)
    
    # Cek apakah ini perintah 2 kata dengan pola "buka/tutup + kata_lain"
    # Untuk menangani kesalahan transkripsi seperti "tutup tilai", "buka gulai", dll
    is_two_word_command = False
    if len(teks_words) == 2:
        first_word = teks_words[0]
        second_word = teks_words[1]
        # Jika kata pertama adalah perintah buka/tutup, terima perintah
        if first_word in ['buka', 'bukain', 'tutup', 'tutupin']:
            # Terima jika kata kedua mirip dengan tirai/gorden atau bukan blacklist
            if second_word in kata_mirip_tirai or second_word in kata_mirip_gorden or second_word not in objek_blacklist:
                is_two_word_command = True
    
    # Threshold confidence yang lebih rendah (0.5 atau 50%) untuk lebih toleran
    # DAN harus ada kata kunci yang relevan
    if probabilitas < 0.5:
        pesan_balik = f"Perintah tidak dikenali. Coba ucapkan 'buka gorden' atau 'tutup gorden'."
        status = "error"
        prediksi = "UNKNOWN"
    elif ada_objek_blacklist:
        # Jika ada objek yang di-blacklist, tolak perintah
        pesan_balik = f"Perintah tidak sesuai. Sistem ini hanya untuk kontrol gorden/tirai."
        status = "error"
        prediksi = "UNKNOWN"
    elif prediksi == "BUKA" and ada_kata_buka:
        # Terima jika:
        # 1. Ada kata objek yang tepat (gorden/tirai)
        # 2. Perintah singkat (hanya "buka")
        # 3. Perintah 2 kata (buka + apapun yang bukan blacklist)
        # 4. Ada kata mirip tirai/gorden (toleransi kesalahan transkripsi)
        # 5. Kata kunci konteks situasional (1-3 kata yang ada di kata_kunci_buka)
        if ada_kata_objek or is_perintah_singkat or is_two_word_command or ada_kata_mirip_tirai or ada_kata_mirip_gorden or is_konteks_situasional:
            pesan_balik = "Siap, membuka gorden... ☀️"
            status = "success"
        else:
            pesan_balik = f"Perintah tidak sesuai. Silakan ucapkan 'buka gorden' atau 'buka tirai'."
            status = "error"
            prediksi = "UNKNOWN"
    elif prediksi == "TUTUP" and ada_kata_tutup:
        # Terima jika:
        # 1. Ada kata objek yang tepat (gorden/tirai)
        # 2. Perintah singkat (hanya "tutup")
        # 3. Perintah 2 kata (tutup + apapun yang bukan blacklist)
        # 4. Ada kata mirip tirai/gorden (toleransi kesalahan transkripsi)
        # 5. Kata kunci konteks situasional (1-3 kata yang ada di kata_kunci_tutup)
        if ada_kata_objek or is_perintah_singkat or is_two_word_command or ada_kata_mirip_tirai or ada_kata_mirip_gorden or is_konteks_situasional:
            pesan_balik = "Siap, menutup gorden... 🌑"
            status = "success"
        else:
            pesan_balik = f"Perintah tidak sesuai. Silakan ucapkan 'tutup gorden' atau 'tutup tirai'."
            status = "error"
            prediksi = "UNKNOWN"
    else:
        # Prediksi ada tapi tidak ada kata kunci yang relevan
        pesan_balik = f"Perintah tidak sesuai. Silakan ucapkan perintah yang jelas seperti 'buka gorden' atau 'tutup gorden'."
        status = "error"
        prediksi = "UNKNOWN"
    
    return {
        'status': status,
        'pesan': pesan_balik,
        'prediksi': prediksi,
        'probabilitas': probabilitas,
        'teks_asli': teks
    }

# --- 2. ROUTE UTAMA ---

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/proses_suara', methods=['POST'])
def proses_suara():
    """Endpoint untuk menerima TEKS mentah (diketik manual)"""
    data = request.get_json()
    teks_user = data.get('teks', '')
    
    print(f"📥 [proses_suara] Input Teks: {teks_user}")
    
    # Gunakan fungsi helper untuk prediksi
    hasil = prediksi_intent(teks_user)
    
    # Process voice command if valid (same logic as /proses_audio)
    database_updated = False
    mqtt_sent = False
    notification_created = False
    
    if hasil['status'] == 'success' and hasil['prediksi'] in ['BUKA', 'TUTUP']:
        intent = hasil['prediksi']
        confidence = hasil['probabilitas']
        
        print(f"🎯 [proses_suara] Valid command detected: {intent} (confidence: {confidence:.2f})")
        
        # Update curtain_data in database
        if is_db_available():
            database_updated = update_curtain_data(intent, preserve_sensors=True)
            
            # Log the voice control action
            if database_updated:
                log_voice_control(
                    intent=intent,
                    transcript=teks_user,
                    status='success',
                    ip_address=request.remote_addr,
                    confidence=confidence
                )
            
            # Send MQTT command to ESP32
            if database_updated and is_mqtt_available():
                mqtt_sent = send_voice_command(intent, teks_user)
                
                # Update log status if MQTT failed
                if not mqtt_sent:
                    log_voice_control(
                        intent=intent,
                        transcript=teks_user,
                        status='failed',
                        ip_address=request.remote_addr,
                        confidence=confidence
                    )
            
            # Create notification
            notification_created = create_voice_notification(
                intent=intent,
                transcript=teks_user,
                success=database_updated and mqtt_sent
            )
        else:
            print("⚠️ [proses_suara] Database not available, skipping database operations")
    
    # Add operation status to response
    hasil['database_updated'] = database_updated
    hasil['mqtt_sent'] = mqtt_sent
    hasil['notification_created'] = notification_created
    hasil['database_available'] = is_db_available()
    hasil['mqtt_available'] = is_mqtt_available()
    
    return jsonify(hasil)

@app.route('/proses_audio', methods=['POST'])
def proses_audio():
    """
    Endpoint menerima FILE audio, transkrip via Gemini 2.0 Flash, 
    lalu prediksi intent via Model Lokal.
    """
    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': 'Tidak ada file audio'}), 400

    f = request.files['file']
    # Default ke m4a jika tidak ada nama
    filename = secure_filename(f.filename or 'recording.m4a') 

    # 1. Simpan File Sementara
    tmp_dir = os.path.join(os.getcwd(), 'uploads')
    os.makedirs(tmp_dir, exist_ok=True)
    save_path = os.path.join(tmp_dir, filename)
    f.save(save_path)
    
    print(f"🎙️ [proses_audio] File diterima: {filename}")

    try:
        # 2. Validasi Ukuran File
        if os.path.getsize(save_path) == 0:
             return jsonify({'status': 'error', 'message': 'File audio kosong'}), 400

        # 3. Upload ke Gemini
        print("🤖 [proses_audio] Mengunggah file...")
        gemini_file = genai.upload_file(save_path, mime_type="audio/mpeg")

        # Menggunakan model yang TERSEDIA di daftar Anda (2.0 Flash)
        try:
            model_name = "models/gemini-2.5-flash" 
            print(f"✨ Menggunakan model: Speech-to-Text")
            model_gemini = genai.GenerativeModel(model_name)
        except Exception as e:
            print(f"⚠️ Gagal memuat model utama, mencoba fallback: {e}")
            model_gemini = genai.GenerativeModel("models/gemini-2.5-flash-lite")

        # 4. Minta Transkripsi
        print("🤖 [proses_audio] Meminta transkripsi...")
        response = model_gemini.generate_content([
            "Transkripsikan audio ini ke dalam teks bahasa Indonesia. Tuliskan hanya kata-kata yang diucapkan saja tanpa tanda baca.",
            gemini_file
        ])
        
        # Cek hasil
        if not response.text:
             transcript_text = ""
             print("⚠️ [proses_audio] Gemini tidak mengembalikan teks.")
        else:
             transcript_text = response.text.strip()
             print(f"📝 [proses_audio] Hasil Transkrip: {transcript_text}")

        # 5. Masukkan hasil transkrip ke Model Prediksi Intent Lokal
        # Fungsi ini sekarang SUDAH ADA di atas
        hasil_prediksi = prediksi_intent(transcript_text)

        # 6. Process voice command if valid (confidence >= 0.5 and valid intent)
        database_updated = False
        mqtt_sent = False
        notification_created = False
        
        if hasil_prediksi['status'] == 'success' and hasil_prediksi['prediksi'] in ['BUKA', 'TUTUP']:
            intent = hasil_prediksi['prediksi']
            confidence = hasil_prediksi['probabilitas']
            
            print(f"🎯 [proses_audio] Valid command detected: {intent} (confidence: {confidence:.2f})")
            
            # Update curtain_data in database
            if is_db_available():
                database_updated = update_curtain_data(intent, preserve_sensors=True)
                
                # Log the voice control action
                if database_updated:
                    log_voice_control(
                        intent=intent,
                        transcript=transcript_text,
                        status='success',
                        ip_address=request.remote_addr,
                        confidence=confidence
                    )
                
                # Send MQTT command to ESP32
                if database_updated and is_mqtt_available():
                    mqtt_sent = send_voice_command(intent, transcript_text)
                    
                    # Update log status if MQTT failed
                    if not mqtt_sent:
                        log_voice_control(
                            intent=intent,
                            transcript=transcript_text,
                            status='failed',
                            ip_address=request.remote_addr,
                            confidence=confidence
                        )
                
                # Create notification
                notification_created = create_voice_notification(
                    intent=intent,
                    transcript=transcript_text,
                    success=database_updated and mqtt_sent
                )
            else:
                print("⚠️ [proses_audio] Database not available, skipping database operations")

        # Gabungkan hasil
        response_data = {
            **hasil_prediksi,
            'text': transcript_text,
            'database_updated': database_updated,
            'mqtt_sent': mqtt_sent,
            'notification_created': notification_created,
            'database_available': is_db_available(),
            'mqtt_available': is_mqtt_available()
        }

        # Bersihkan file lokal
        try:
            os.remove(save_path)
        except:
            pass

        return jsonify(response_data)

    except Exception as e:
        print(f"❌ [proses_audio] Error: {e}")
        # Hapus file jika error
        if os.path.exists(save_path):
            try: os.remove(save_path)
            except: pass
            
        return jsonify({
            'status': 'error', 
            'message': str(e),
            'database_available': is_db_available(),
            'mqtt_available': is_mqtt_available()
        }), 500

# --- 3. ROUTE LAINNYA (Upload/Chatbot) ---

@app.route('/upload', methods=['GET', 'POST'])
def upload_audio_long():
    if request.method == 'POST':
        audios = request.files.getlist('audio')
        user_id = session.get('user_id')

        if not user_id:
            return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401

        if audios:
            all_transcribe = []
            # Menggunakan 2.0 Flash agar konsisten
            model_gen = genai.GenerativeModel('models/gemini-2.0-flash')

            upload_folder = os.path.join(current_app.root_path, 'static', 'uploads_long')
            os.makedirs(upload_folder, exist_ok=True)

            try:
                for audio in audios:
                    if audio.filename == '': continue
                    
                    filename = secure_filename(audio.filename)
                    path = os.path.join(upload_folder, filename)
                    audio.save(path)

                    g_file = genai.upload_file(path, mime_type='audio/mpeg')
                    resp = model_gen.generate_content([
                        "Buatkan transkrip percakapan detail dari audio ini.", 
                        g_file
                    ])
                    all_transcribe.append(resp.text)

                combined = "\n\n".join(all_transcribe)
                
                if mongo:
                    new_transkrip = {
                        "name": audios[0].filename,
                        "teks": combined,
                        "user_id": user_id,
                        "created_at": datetime.now()
                    }
                    mongo.db.transkrip.insert_one(new_transkrip)
                    return redirect(url_for('upload.daftar_soal', transkrip_id=str(new_transkrip["_id"])))
                
                return jsonify({'status': 'success', 'transkrip': combined})

            except Exception as e:
                print(f"Error Upload Long: {e}")
                return jsonify({'status': 'error', 'message': str(e)}), 500

    return render_template('upload.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
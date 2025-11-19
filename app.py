from flask import Flask, render_template, request, jsonify
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

app = Flask(__name__)

# --- 1. MEMBANGUN MODEL NLP (Sama seperti sebelumnya) ---
# Kita latih model setiap kali server dinyalakan (untuk kesederhanaan)
data_latih = [
    ("buka gorden", "BUKA"), ("buka tirai", "BUKA"), ("tolong buka", "BUKA"),
    ("biarkan cahaya masuk", "BUKA"), ("gordennya dibuka", "BUKA"),
    ("tutup gorden", "TUTUP"), ("tutup tirai", "TUTUP"),
    ("gelap sekali tutup", "TUTUP"), ("saya mau tidur", "TUTUP"),
    ("halo", "UNKNOWN"), ("apa kabar", "UNKNOWN")
]
kalimat, label = zip(*data_latih)
model = make_pipeline(CountVectorizer(), MultinomialNB())
model.fit(kalimat, label)
print("✅ Model NLP siap digunakan di Website!")

# --- 2. ROUTE WEBSITE ---

@app.route('/')
def home():
    # Menampilkan halaman HTML
    return render_template('index.html')

@app.route('/proses_suara', methods=['POST'])
def proses_suara():
    # Menerima teks dari JavaScript
    data = request.get_json()
    teks_user = data.get('teks', '')
    
    print(f"📥 Menerima input: {teks_user}")

    # Prediksi menggunakan Model
    prediksi = model.predict([teks_user])[0]
    probabilitas = np.max(model.predict_proba([teks_user]))

    # Logika Respon
    pesan_balik = ""
    status = "info" # info, success, error

    if probabilitas < 0.6 or prediksi == "UNKNOWN":
        pesan_balik = "Maaf, saya tidak mengerti perintah tersebut."
        status = "error"
    elif prediksi == "BUKA":
        pesan_balik = "Gorden Terbuka ✅"
        status = "success"
        # Di sini Anda bisa tambahkan kode IoT ke Arduino
    elif prediksi == "TUTUP":
        pesan_balik = "Gorden Tertutup 🌑"
        status = "success"
        # Di sini Anda bisa tambahkan kode IoT ke Arduino
    elif prediksi == "":
        pesan_balik = "Silahkan berikan saya perintah."
        status = "error"

    return jsonify({'pesan': pesan_balik, 'status': status, 'teks_asli': teks_user})

if __name__ == '__main__':
    app.run(debug=True)
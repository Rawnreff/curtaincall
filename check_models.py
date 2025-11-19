import google.generativeai as genai

genai.configure(api_key="AIzaSyDftTINyC6Vj6JG_8eubCetB9G0FBtaAvM")

for m in genai.list_models():
    print(m.name)

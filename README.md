# Coach
Interactive personal trainer for stretching and yoga. 
# Coach Beeps (Edge)

Two tiny audio endpoints (WAV) for a GPT personal trainer/coach:

- `GET /api/beep?ms=300` → 440 Hz tone (50–2000 ms)
- `GET /api/chime?hz=784&ms=600` → variable pitch (110–2000 Hz), 50–4000 ms

Both return **mono 16-bit WAV** and run on **Vercel Edge**.

---

## 60-second deploy

1) **Push to GitHub**  
   Create a repo named `coach-beeps` and add this folder’s contents.

2) **Deploy on Vercel**  
   Vercel → *Add New Project* → import the repo → Deploy.

3) **Note your domain**  
   Example: `https://your-app.vercel.app`

4) **Update OpenAPI**  
   Edit `openapi.yaml`:
   ```yaml
   servers:
     - url: https://YOUR-DEPLOYED-DOMAIN/api

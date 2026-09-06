"use client";

import { useState } from "react";

type VideoStyle = "UGC Vendedor" | "POV Vendedor" | "Showcase";

const styles: VideoStyle[] = [
  "UGC Vendedor",
  "POV Vendedor",
  "Showcase",
];

const durations = [4, 8, 12];

export default function Home() {
  const [image, setImage] = useState<string>("");
  const [style, setStyle] = useState<VideoStyle>("UGC Vendedor");
  const [seconds, setSeconds] = useState<number>(8);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");

  async function prepareImage(file: File) {
    return new Promise<string>((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");

        canvas.width = 720;
        canvas.height = 1280;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Não foi possível preparar a imagem."));
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 720, 1280);

        const scale = Math.min(
          720 / img.width,
          1280 / img.height
        );

        const width = img.width * scale;
        const height = img.height * scale;

        const x = (720 - width) / 2;
        const y = (1280 - height) / 2;

        ctx.drawImage(img, x, y, width, height);

        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = () => {
        reject(new Error("Não foi possível carregar a imagem."));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  async function handleImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setError("");
      setVideoUrl("");
      setStatus("Preparando imagem...");

      const prepared = await prepareImage(file);

      setImage(prepared);
      setStatus("Imagem pronta!");
    } catch (err) {
      console.error(err);
      setError("Não foi possível preparar a imagem.");
      setStatus("");
    }
  }

  function createPrompt() {
    const base = `
Create an ultra-realistic Brazilian TikTok Shop selling video.

FORMAT:
Vertical 9:16.
Real smartphone camera.
Natural lighting.
Realistic Brazilian creator.
Natural human movement.
Natural facial expressions.
Natural hands.
No cinematic commercial look.

PRODUCT:
The product must remain EXACTLY identical to the reference image.
Do not change its color, shape, size, texture, packaging, logo, label or details.
Do not invent accessories.
Do not create extra products.

AUDIO:
AUDIO IS REQUIRED.
The creator MUST speak in Brazilian Portuguese.
Natural Brazilian Portuguese voice.
Natural conversational tone.
Do not generate a silent video.
Do not replace speech with music.

TEXT:
NO subtitles.
NO captions.
NO text on screen.
NO emojis.
NO banners.
NO graphics.

STRUCTURE:
Start immediately with a strong natural hook.
Show the product clearly.
Mention a real benefit of the product.
End with a short natural call to action.

IMPORTANT:
The creator MUST speak during the video.
The CTA MUST be spoken during the final 2 seconds.
Do not end the video before the CTA is spoken.
`;

    let styleInstructions = "";

    if (style === "UGC Vendedor") {
      styleInstructions = `
STYLE:
A real Brazilian female creator presenting the product to her followers.
Selfie smartphone camera.
She holds and demonstrates the product naturally.
She speaks directly to the camera.

DIALOGUE:
Start with:
"Olha isso aqui!"

Then naturally talk about the product and one useful benefit.

At the end she MUST say:
"Gostou? Olha o carrinho."
`;
    }

    if (style === "POV Vendedor") {
      styleInstructions = `
STYLE:
POV smartphone video.
The viewer feels like they are personally seeing the product.
Real human hands interact naturally with the product.
The creator speaks naturally while demonstrating it.

DIALOGUE:
Start with:
"Olha o que eu achei!"

Then naturally show the product and mention one useful benefit.

At the end she MUST say:
"Se curtiu, confere o carrinho."
`;
    }

    if (style === "Showcase") {
      styleInstructions = `
STYLE:
Realistic product showcase.
The product is clearly visible.
Natural camera movement.
Hands interact naturally with the product.
The presentation must still feel like a real creator recommendation, not a commercial.

DIALOGUE:
Start with:
"Olha isso!"

Then briefly present the product and one useful benefit.

At the end she MUST say:
"Gostou? Tá no carrinho."
`;
    }

    const durationInstructions =
      seconds === 4
        ? `
DURATION:
4 seconds.
Keep the dialogue extremely short.
Hook, product benefit and CTA must fit naturally.
`
        : seconds === 8
        ? `
DURATION:
8 seconds.

TIMING:
0-2 seconds: strong hook.
2-6 seconds: product and benefit.
6-8 seconds: spoken CTA.

The CTA must happen before the video ends.
`
        : `
DURATION:
12 seconds.

TIMING:
0-3 seconds: strong hook.
3-7 seconds: show product and problem/desire.
7-10 seconds: demonstrate benefit.
10-12 seconds: spoken CTA.

The CTA must happen before the video ends.
`;

    return base + styleInstructions + durationInstructions;
  }

  async function generateVideo() {
    if (!image) {
      setError("Envie uma foto do produto primeiro.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setVideoUrl("");
      setStatus("Enviando produto para gerar o vídeo...");

      const prompt = createPrompt();

      const response = await fetch("/api/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image,
          prompt,
          seconds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Erro ao iniciar geração do vídeo."
        );
      }

      const videoId = data.id;

      if (!videoId) {
        throw new Error("A API não retornou o ID do vídeo.");
      }

      setStatus("Vídeo sendo criado...");

      let attempts = 0;
      const maxAttempts = 120;

      while (attempts < maxAttempts) {
        attempts++;

        await new Promise((resolve) =>
          setTimeout(resolve, 5000)
        );

        const pollResponse = await fetch(
          `/api/video?id=${encodeURIComponent(videoId)}`
        );

        const pollData = await pollResponse.json();

        if (!pollResponse.ok) {
          throw new Error(
            pollData?.error || "Erro ao consultar o vídeo."
          );
        }

        if (pollData.status === "completed") {
          if (pollData.url) {
            setVideoUrl(pollData.url);
            setStatus("Vídeo pronto! 🎉");
            setLoading(false);
            return;
          }

          if (pollData.video_url) {
            setVideoUrl(pollData.video_url);
            setStatus("Vídeo pronto! 🎉");
            setLoading(false);
            return;
          }

          throw new Error(
            "O vídeo foi concluído, mas a URL não foi encontrada."
          );
        }

        if (
          pollData.status === "failed" ||
          pollData.status === "cancelled"
        ) {
          throw new Error(
            pollData.error || "A geração do vídeo falhou."
          );
        }

        setStatus(
          `Gerando vídeo... ${Math.min(
            attempts,
            99
          )}%`
        );
      }

      throw new Error(
        "A geração demorou mais que o esperado. Tente novamente."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao gerar o vídeo."
      );

      setStatus("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #111827, #1f2937)",
        color: "#ffffff",
        padding: "30px 16px",
        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <h1
            style={{
              fontSize: "34px",
              marginBottom: "10px",
              fontWeight: 800,
            }}
          >
            ViralShop AI
          </h1>

          <p
            style={{
              fontSize: "17px",
              opacity: 0.85,
            }}
          >
            Crie vídeos realistas para TikTok Shop
          </p>
        </header>

        <section
          style={{
            background: "#ffffff",
            color: "#111827",
            borderRadius: "20px",
            padding: "24px",
            boxShadow:
              "0 20px 50px rgba(0,0,0,0.25)",
          }}
        >
          <h2
            style={{
              fontSize: "21px",
              marginBottom: "10px",
            }}
          >
            1. Envie a foto do produto
          </h2>

          <p
            style={{
              color: "#6b7280",
              marginBottom: "16px",
            }}
          >
            PNG, JPG ou WEBP
          </p>

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImage}
            style={{
              width: "100%",
              padding: "14px",
              border:
                "2px dashed #d1d5db",
              borderRadius: "12px",
              cursor: "pointer",
              background: "#f9fafb",
            }}
          />

          {image && (
            <div
              style={{
                marginTop: "20px",
                textAlign: "center",
              }}
            >
              <img
                src={image}
                alt="Produto"
                style={{
                  width: "180px",
                  height: "320px",
                  objectFit: "contain",
                  borderRadius: "14px",
                  background: "#f3f4f6",
                  border:
                    "1px solid #e5e7eb",
                }}
              />
            </div>
          )}

          <h2
            style={{
              fontSize: "21px",
              marginTop: "30px",
              marginBottom: "14px",
            }}
          >
            2. Estilo do vídeo
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: "10px",
            }}
          >
            {styles.map((item) => (
              <button
                key={item}
                onClick={() => setStyle(item)}
                style={{
                  padding: "14px 8px",
                  borderRadius: "12px",
                  border:
                    style === item
                      ? "3px solid #111827"
                      : "1px solid #d1d5db",
                  background:
                    style === item
                      ? "#f3f4f6"
                      : "#ffffff",
                  color: "#111827",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <h2
            style={{
              fontSize: "21px",
              marginTop: "30px",
              marginBottom: "14px",
            }}
          >
            3. Duração
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: "10px",
            }}
          >
            {durations.map((item) => (
              <button
                key={item}
                onClick={() => setSeconds(item)}
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  border:
                    seconds === item
                      ? "3px solid #111827"
                      : "1px solid #d1d5db",
                  background:
                    seconds === item
                      ? "#f3f4f6"
                      : "#ffffff",
                  color: "#111827",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {item} segundos
              </button>
            ))}
          </div>

          <button
            onClick={generateVideo}
            disabled={loading || !image}
            style={{
              width: "100%",
              marginTop: "30px",
              padding: "18px",
              border: "none",
              borderRadius: "14px",
              background:
                loading || !image
                  ? "#9ca3af"
                  : "#111827",
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: 800,
              cursor:
                loading || !image
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading
              ? "GERANDO VÍDEO..."
              : "GERAR VÍDEO"}
          </button>

          {status && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px",
                borderRadius: "12px",
                background: "#f3f4f6",
                color: "#111827",
                textAlign: "center",
                fontWeight: 700,
              }}
            >
              {status}
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px",
                borderRadius: "12px",
                background: "#fee2e2",
                color: "#991b1b",
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          )}

          {videoUrl && (
            <div
              style={{
                marginTop: "30px",
              }}
            >
              <h2
                style={{
                  fontSize: "22px",
                  marginBottom: "15px",
                }}
              >
                🎉 Seu vídeo está pronto!
              </h2>

              <video
                src={videoUrl}
                controls
                playsInline
                style={{
                  width: "100%",
                  maxHeight: "700px",
                  objectFit: "contain",
                  borderRadius: "16px",
                  background: "#000000",
                }}
              />

              <a
                href={videoUrl}
                download="viralshop-video.mp4"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  textAlign: "center",
                  marginTop: "16px",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#111827",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: 800,
                }}
              >
                BAIXAR VÍDEO
              </a>
            </div>
          )}
        </section>

        <footer
          style={{
            textAlign: "center",
            marginTop: "25px",
            opacity: 0.7,
            fontSize: "14px",
          }}
        >
          ViralShop AI · Criado para acelerar
          sua produção de TikTok Shop
        </footer>
      </div>
    </main>
  );
}

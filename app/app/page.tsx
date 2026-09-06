```tsx
"use client";

import { ChangeEvent, useState } from "react";

type VideoStyle = "UGC Vendedor" | "POV Vendedor" | "Showcase";
type Duration = "4 segundos" | "8 segundos" | "12 segundos";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [style, setStyle] = useState<VideoStyle>("UGC Vendedor");
  const [duration, setDuration] = useState<Duration>("8 segundos");

  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // PREPARAR FOTO EM 9:16
  // ==========================================

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Use uma imagem PNG, JPG, JPEG ou WEBP.");
      return;
    }

    setError("");

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const width = 720;
        const height = 1280;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          setError("Não foi possível preparar a imagem.");
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        const scale = Math.min(
          width / img.width,
          height / img.height
        );

        const newWidth = img.width * scale;
        const newHeight = img.height * scale;

        const x = (width - newWidth) / 2;
        const y = (height - newHeight) / 2;

        ctx.drawImage(
          img,
          x,
          y,
          newWidth,
          newHeight
        );

        const finalImage = canvas.toDataURL(
          "image/png",
          1
        );

        setImage(finalImage);
        setVideoUrl(null);
        setProgress(0);
        setStatus("");
      };

      img.onerror = () => {
        setError("Não foi possível carregar a imagem.");
      };

      img.src = reader.result as string;
    };

    reader.onerror = () => {
      setError("Não foi possível ler a imagem.");
    };

    reader.readAsDataURL(file);
  }

  // ==========================================
  // PROMPT CURTO E VENDEDOR
  // ==========================================

  function createSellerPrompt() {
    const seconds = Number(
      duration.replace(" segundos", "")
    );

    const base = `
Create an ultra-realistic Brazilian TikTok Shop selling video.

Use the reference image as the absolute truth.
The product must remain EXACTLY identical to the image.
Do not change its color, shape, size, texture, material,
packaging, logo, labels or details.

Vertical 9:16.
Real smartphone UGC style.
Natural Brazilian environment.
Natural human movements.
Natural realistic hands.
Authentic facial expressions.
Realistic lighting.

Brazilian Portuguese spoken dialogue only.
Natural human voice.
No robotic voice.
No narrator.
No text on screen.
No subtitles.
No captions.
No emojis.
No graphics.

IMPORTANT:
The creator MUST speak during the video.

The video must have a clear beginning, middle and ending.

Most important:
The creator MUST say a natural CTA during the FINAL seconds.

Never end the video before the CTA is spoken.

The CTA must invite the viewer to check the product
in the TikTok Shop shopping cart.

Do not invent features or make unrealistic claims.
Keep the product visible during the selling moments.
Keep the video dynamic and natural.
`;

    if (style === "UGC Vendedor") {
      return `
${base}

STYLE: UGC SELLER.

A Brazilian creator talks directly to the smartphone camera.

TIMING:

0-${Math.min(3, seconds)} seconds:
Strong curiosity hook and immediately show the product.

Middle:
Quickly explain why the product caught their attention
and mention one real useful benefit.

FINAL 2-3 seconds:
The creator MUST clearly speak this CTA naturally:

"Se você gostou, dá uma olhadinha no carrinho."

The CTA is mandatory.
The video MUST finish after the CTA.
`.trim();
    }

    if (style === "POV Vendedor") {
      return `
${base}

STYLE: POV SELLER.

The camera feels like a real person holding a smartphone.
Show natural hands interacting with the product.

TIMING:

Beginning:
Start immediately with curiosity and reveal the product.

Middle:
Show the product being handled or used naturally.
Mention one useful benefit.

FINAL 2-3 seconds:
The creator MUST clearly speak:

"Se você gostou, dá uma olhadinha no carrinho."

The CTA is mandatory.
The video MUST finish after the CTA.
`.trim();
    }

    return `
${base}

STYLE: HUMAN PRODUCT SHOWCASE.

The product is the main visual focus.
Use realistic smartphone close-ups and natural movement.

Beginning:
Immediately reveal the product.

Middle:
Show important details and one real benefit.
A human creator speaks naturally in Brazilian Portuguese.

FINAL 2-3 seconds:
The creator MUST clearly speak:

"Se você gostou, dá uma olhadinha no carrinho."

The CTA is mandatory.
The video MUST finish after the CTA.
`.trim();
  }

  // ==========================================
  // GERAR VÍDEO
  // ==========================================

  async function generateVideo() {
    if (!image) {
      setError("Primeiro envie a foto do produto.");
      return;
    }

    setLoading(true);
    setError("");
    setVideoUrl(null);
    setProgress(0);

    try {
      const generatedPrompt = createSellerPrompt();

      setPrompt(generatedPrompt);

      setStatus("Preparando seu vídeo vendedor...");

      const seconds = Number(
        duration.replace(" segundos", "")
      );

      const response = await fetch("/api/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image,
          prompt: generatedPrompt,
          seconds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Não foi possível iniciar o vídeo."
        );
      }

      if (!data.id) {
        throw new Error(
          "A API não retornou o ID do vídeo."
        );
      }

      const videoId = data.id;

      setStatus("Vídeo enviado para geração...");
      setProgress(data.progress ?? 0);

      let finished = false;
      let attempts = 0;

      while (!finished && attempts < 120) {
        attempts++;

        await new Promise((resolve) =>
          setTimeout(resolve, 5000)
        );

        const statusResponse = await fetch(
          `/api/video?id=${encodeURIComponent(videoId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const statusData =
          await statusResponse.json();

        if (!statusResponse.ok) {
          throw new Error(
            statusData?.error ||
              "Erro ao consultar o vídeo."
          );
        }

        const currentProgress =
          statusData.progress ?? 0;

        setProgress(currentProgress);

        if (statusData.status === "completed") {
          finished = true;

          setStatus("Vídeo pronto!");

          setProgress(100);

          setVideoUrl(
            `/api/video?id=${encodeURIComponent(
              videoId
            )}&download=1`
          );

          break;
        }

        if (
          statusData.status === "failed" ||
          statusData.status === "cancelled"
        ) {
          throw new Error(
            statusData?.error ||
              "A geração do vídeo não foi concluída."
          );
        }

        setStatus(
          `Criando vídeo vendedor... ${currentProgress}%`
        );
      }

      if (!finished) {
        throw new Error(
          "A geração demorou mais que o esperado. Tente novamente."
        );
      }
    } catch (err) {
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

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#08080c,#111118)",
        color: "#fff",
        padding: "32px 16px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            textAlign: "center",
            marginBottom: 30,
          }}
        >
          <h1
            style={{
              fontSize: 36,
              fontWeight: 900,
              margin: 0,
            }}
          >
            ViralShop AI
          </h1>

          <p
            style={{
              color: "#aaa",
              fontSize: 16,
              marginTop: 8,
            }}
          >
            Transforme a foto do produto em um vídeo
            vendedor realista
          </p>
        </header>

        {/* FOTO */}

        <section
          style={{
            background: "#17171e",
            borderRadius: 18,
            padding: 22,
            marginBottom: 18,
          }}
        >
          <h2
            style={{
              fontSize: 19,
              marginTop: 0,
            }}
          >
            1. Foto do produto
          </h2>

          <label
            style={{
              display: "block",
              border: "2px dashed #444",
              borderRadius: 16,
              padding: 20,
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            {image ? (
              <img
                src={image}
                alt="Produto"
                style={{
                  width: "100%",
                  maxWidth: 360,
                  aspectRatio: "9 / 16",
                  objectFit: "contain",
                  borderRadius: 12,
                }}
              />
            ) : (
              <div
                style={{
                  padding: "60px 10px",
                  color: "#aaa",
                }}
              >
                Clique aqui para enviar a foto do produto
              </div>
            )}

            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleImage}
              style={{
                display: "none",
              }}
            />
          </label>

          {image && (
            <p
              style={{
                color: "#777",
                fontSize: 12,
                textAlign: "center",
                marginBottom: 0,
              }}
            >
              Foto preparada automaticamente em 9:16
            </p>
          )}
        </section>

        {/* ESTILO */}

        <section
          style={{
            background: "#17171e",
            borderRadius: 18,
            padding: 22,
            marginBottom: 18,
          }}
        >
          <h2
            style={{
              fontSize: 19,
              marginTop: 0,
            }}
          >
            2. Estilo do vídeo
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3,1fr)",
              gap: 10,
            }}
          >
            {(
              [
                "UGC Vendedor",
                "POV Vendedor",
                "Showcase",
              ] as VideoStyle[]
            ).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStyle(item)}
                style={{
                  padding: "15px 8px",
                  borderRadius: 12,
                  border:
                    style === item
                      ? "2px solid #fff"
                      : "1px solid #444",
                  background:
                    style === item
                      ? "#fff"
                      : "#22222a",
                  color:
                    style === item
                      ? "#000"
                      : "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {/* DURAÇÃO */}

        <section
          style={{
            background: "#17171e",
            borderRadius: 18,
            padding: 22,
            marginBottom: 18,
          }}
        >
          <h2
            style={{
              fontSize: 19,
              marginTop: 0,
            }}
          >
            3. Duração
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3,1fr)",
              gap: 10,
            }}
          >
            {(
              [
                "4 segundos",
                "8 segundos",
                "12 segundos",
              ] as Duration[]
            ).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setDuration(item)}
                style={{
                  padding: 15,
                  borderRadius: 12,
                  border:
                    duration === item
                      ? "2px solid #fff"
                      : "1px solid #444",
                  background:
                    duration === item
                      ? "#fff"
                      : "#22222a",
                  color:
                    duration === item
                      ? "#000"
                      : "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {/* BOTÃO */}

        <button
          type="button"
          onClick={generateVideo}
          disabled={loading}
          style={{
            width: "100%",
            padding: "19px 20px",
            border: "none",
            borderRadius: 15,
            background: loading ? "#555" : "#fff",
            color: loading ? "#ccc" : "#000",
            fontSize: 18,
            fontWeight: 900,
            cursor: loading
              ? "not-allowed"
              : "pointer",
            marginBottom: 18,
          }}
        >
          {loading
            ? "CRIANDO VÍDEO..."
            : "GERAR VÍDEO VENDEDOR"}
        </button>

        {/* STATUS */}

        {loading && (
          <section
            style={{
              background: "#17171e",
              borderRadius: 16,
              padding: 20,
              marginBottom: 18,
            }}
          >
            <p
              style={{
                marginTop: 0,
                color: "#ddd",
              }}
            >
              {status}
            </p>

            <div
              style={{
                height: 10,
                background: "#292932",
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "#fff",
                  transition:
                    "width .4s ease",
                }}
              />
            </div>

            <p
              style={{
                fontSize: 13,
                color: "#888",
                marginBottom: 0,
              }}
            >
              {progress}%
            </p>
          </section>
        )}

        {/* ERRO */}

        {error && (
          <section
            style={{
              background: "#321919",
              border: "1px solid #6b3030",
              borderRadius: 14,
              padding: 16,
              marginBottom: 18,
              color: "#ffb5b5",
            }}
          >
            {error}
          </section>
        )}

        {/* VÍDEO */}

        {videoUrl && (
          <section
            style={{
              background: "#17171e",
              borderRadius: 18,
              padding: 20,
              textAlign: "center",
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              Seu vídeo está pronto!
            </h2>

            <video
              src={videoUrl}
              controls
              playsInline
              style={{
                width: "100%",
                maxWidth: 420,
                aspectRatio: "9 / 16",
                objectFit: "contain",
                borderRadius: 14,
                background: "#000",
              }}
            />

            <a
              href={videoUrl}
              download="viralshop-video.mp4"
              style={{
                display: "block",
                marginTop: 18,
                padding: "15px 20px",
                borderRadius: 12,
                background: "#fff",
                color: "#000",
                textDecoration: "none",
                fontWeight: 900,
              }}
            >
              BAIXAR VÍDEO
            </a>
          </section>
        )}

        {/* PROMPT */}

        {prompt && !loading && (
          <details
            style={{
              marginTop: 20,
              color: "#777",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
              }}
            >
              Ver prompt utilizado
            </summary>

            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 12,
                lineHeight: 1.5,
                marginTop: 12,
              }}
            >
              {prompt}
            </pre>
          </details>
        )}

        <p
          style={{
            textAlign: "center",
            color: "#555",
            fontSize: 12,
            marginTop: 30,
          }}
        >
          ViralShop AI · Criado para acelerar sua produção
          de TikTok Shop
        </p>
      </div>
    </main>
  );
}
```

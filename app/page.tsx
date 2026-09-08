"use client";

import {
  ChangeEvent,
  useState,
} from "react";

type VideoStyle =
  | "UGC Real"
  | "POV Real"
  | "Showcase";

type Duration =
  | "4 segundos"
  | "8 segundos"
  | "12 segundos";

export default function Home() {
  const [image, setImage] =
    useState<string | null>(null);

  const [style, setStyle] =
    useState<VideoStyle>("UGC Real");

  const [duration, setDuration] =
    useState<Duration>("8 segundos");

  const [prompt, setPrompt] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [progress, setProgress] =
    useState(0);

  const [videoUrl, setVideoUrl] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * ==========================================
   * PREPARAR FOTO
   * ==========================================
   */

  function handleImage(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setError(
        "Use uma imagem PNG, JPG, JPEG ou WEBP."
      );
      return;
    }

    setError("");
    setVideoUrl(null);
    setProgress(0);
    setStatus("");

    const reader =
      new FileReader();

    reader.onload = () => {
      const img =
        new Image();

      img.onload = () => {
        const targetWidth = 720;
        const targetHeight = 1280;

        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width =
          targetWidth;

        canvas.height =
          targetHeight;

        const ctx =
          canvas.getContext("2d");

        if (!ctx) {
          setError(
            "Não foi possível preparar a imagem."
          );
          return;
        }

        /*
         * Fundo branco
         */

        ctx.fillStyle =
          "#ffffff";

        ctx.fillRect(
          0,
          0,
          targetWidth,
          targetHeight
        );

        /*
         * Mantém o produto inteiro.
         */

        const scale =
          Math.min(
            targetWidth /
              img.width,
            targetHeight /
              img.height
          );

        const newWidth =
          img.width * scale;

        const newHeight =
          img.height * scale;

        const x =
          (targetWidth -
            newWidth) /
          2;

        const y =
          (targetHeight -
            newHeight) /
          2;

        ctx.drawImage(
          img,
          x,
          y,
          newWidth,
          newHeight
        );

        const finalImage =
          canvas.toDataURL(
            "image/png"
          );

        setImage(
          finalImage
        );
      };

      img.onerror = () => {
        setError(
          "Não foi possível carregar a imagem."
        );
      };

      img.src =
        reader.result as string;
    };

    reader.onerror = () => {
      setError(
        "Não foi possível ler a imagem."
      );
    };

    reader.readAsDataURL(
      file
    );
  }

  /*
   * ==========================================
   * CRIAR PROMPT
   * ==========================================
   */

  function createPrompt() {
    const common = `
ULTRA-REALISTIC VERTICAL TIKTOK SHOP VIDEO.

The provided reference image is the exact product reference.

PRODUCT FIDELITY IS CRITICAL.

Preserve exactly:
- product identity
- color
- shape
- proportions
- dimensions
- texture
- materials
- packaging
- labels
- logo
- printed details

Never redesign, replace, invent or modify the product.

Format: vertical 9:16.

The video must look like authentic content recorded by a real Brazilian creator using a smartphone.

Natural lighting.
Natural camera movement.
Realistic human behavior.
Realistic hands.
Realistic skin.
Natural facial expressions.

All spoken dialogue must be in Brazilian Portuguese.

No English speech.

No subtitles.
No captions.
No text overlays.
No emojis.
No artificial graphics.
No extra hands.
No distorted fingers.
No duplicated objects.

Do not make unrealistic claims about the product.
Do not invent features that are not visible or provided.

End with a natural invitation to check the product on TikTok Shop.
`;

    if (
      style === "UGC Real"
    ) {
      return `
${common}

STYLE: UGC REAL.

A Brazilian creator is naturally presenting the product.

The camera should feel handheld and slightly imperfect, like a real TikTok video.

Start immediately with a strong conversational hook.

Show the product close to the camera.

Interact naturally with the product.

Use authentic Brazilian Portuguese speech.

The creator should sound spontaneous, confident and conversational.

Focus on real product benefits.

Avoid sounding like a traditional television advertisement.

The final moment should naturally encourage the viewer to check the product in TikTok Shop.
      `.trim();
    }

    if (
      style === "POV Real"
    ) {
      return `
${common}

STYLE: POV REAL.

The camera represents the viewer's point of view.

Show realistic hands interacting with the product.

The camera should behave like a person holding a smartphone.

Start immediately with a strong visual hook.

Move naturally toward the product.

Demonstrate the product through realistic human interaction.

Use natural Brazilian Portuguese speech when appropriate.

The scene should feel spontaneous and authentic, not like a studio commercial.

Finish with a natural TikTok Shop call to action.
      `.trim();
    }

    return `
${common}

STYLE: PRODUCT SHOWCASE.

The product is the main focus.

Use smooth but realistic smartphone camera movement.

Show the product from useful angles.

Move closer to reveal important details.

Keep the product visually consistent throughout the entire video.

Use realistic lighting and shadows.

If human interaction is necessary, use only natural human hands and movements.

If dialogue is used, speak naturally in Brazilian Portuguese.

The final shot should clearly show the product and naturally encourage the viewer to check it on TikTok Shop.
    `.trim();
  }

  /*
   * ==========================================
   * GERAR VÍDEO
   * ==========================================
   */

  async function generateVideo() {
    if (!image) {
      setError(
        "Primeiro envie a foto do produto."
      );
      return;
    }

    if (loading) return;

    setLoading(true);
    setError("");
    setVideoUrl(null);
    setProgress(0);

    try {
      const generatedPrompt =
        createPrompt();

      setPrompt(
        generatedPrompt
      );

      setStatus(
        "Enviando produto para geração..."
      );

      const seconds =
        Number(
          duration.replace(
            " segundos",
            ""
          )
        );

      /*
       * POST
       */

      const response =
        await fetch(
          "/api/video",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              image,
              prompt:
                generatedPrompt,
              seconds,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Não foi possível iniciar a geração."
        );
      }

      if (!data?.id) {
        throw new Error(
          "A API não retornou o ID do vídeo."
        );
      }

      const videoId =
        data.id;

      setStatus(
        "Vídeo colocado na fila..."
      );

      setProgress(
        Number(
          data.progress ?? 0
        )
      );

      /*
       * ========================================
       * POLLING
       * ========================================
       */

      let finished = false;

      let attempts = 0;

      const maxAttempts = 120;

      while (
        !finished &&
        attempts <
          maxAttempts
      ) {
        attempts++;

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              5000
            )
        );

        const statusResponse =
          await fetch(
            `/api/video?id=${encodeURIComponent(
              videoId
            )}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const statusData =
          await statusResponse.json();

        if (
          !statusResponse.ok
        ) {
          throw new Error(
            statusData?.error ||
              "Erro ao consultar o vídeo."
          );
        }

        const currentProgress =
          Number(
            statusData.progress ??
              0
          );

        setProgress(
          currentProgress
        );

        /*
         * COMPLETED
         */

        if (
          statusData.status ===
          "completed"
        ) {
          finished = true;

          setProgress(100);

          setStatus(
            "Vídeo pronto!"
          );

          setVideoUrl(
            `/api/video?id=${encodeURIComponent(
              videoId
            )}&download=1`
          );

          break;
        }

        /*
         * FAILED
         */

        if (
          statusData.status ===
            "failed" ||
          statusData.status ===
            "cancelled"
        ) {
          throw new Error(
            statusData?.error ||
              "A geração do vídeo falhou."
          );
        }

        /*
         * EM PROCESSAMENTO
         */

        setStatus(
          `Gerando vídeo... ${currentProgress}%`
        );
      }

      if (!finished) {
        throw new Error(
          "A geração demorou mais que o esperado. Tente novamente."
        );
      }
    } catch (err) {
      console.error(
        "GENERATE VIDEO ERROR:",
        err
      );

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

  /*
   * ==========================================
   * INTERFACE
   * ==========================================
   */

  return (
    <main
      style={{
        minHeight:
          "100vh",
        background:
          "#0b0b0f",
        color: "#fff",
        padding:
          "30px 16px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin:
            "0 auto",
        }}
      >
        <header
          style={{
            marginBottom: 30,
          }}
        >
          <h1
            style={{
              fontSize: 34,
              fontWeight: 900,
              margin: 0,
            }}
          >
            ViralShop AI
          </h1>

          <p
            style={{
              color: "#aaa",
              marginTop: 8,
            }}
          >
            Crie vídeos realistas
            para TikTok Shop
          </p>
        </header>

        {/* ================= FOTO ================= */}

        <section
          style={{
            background:
              "#15151b",
            borderRadius:
              18,
            padding: 22,
            marginBottom:
              18,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              marginBottom:
                14,
            }}
          >
            1. Foto do produto
          </h2>

          <label
            style={{
              display:
                "block",
              border:
                "2px dashed #444",
              borderRadius:
                14,
              padding: 20,
              textAlign:
                "center",
              cursor:
                "pointer",
            }}
          >
            {image ? (
              <img
                src={image}
                alt="Produto"
                style={{
                  width:
                    "100%",
                  maxWidth:
                    360,
                  aspectRatio:
                    "9 / 16",
                  objectFit:
                    "contain",
                  borderRadius:
                    12,
                }}
              />
            ) : (
              <div
                style={{
                  padding:
                    "45px 10px",
                  color:
                    "#aaa",
                }}
              >
                Clique para
                enviar a foto
                do produto
              </div>
            )}

            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={
                handleImage
              }
              style={{
                display:
                  "none",
              }}
            />
          </label>

          {image && (
            <p
              style={{
                color:
                  "#777",
                fontSize: 12,
                marginTop:
                  10,
                textAlign:
                  "center",
              }}
            >
              Foto preparada
              automaticamente
              em 9:16
            </p>
          )}
        </section>

        {/* ================= ESTILO ================= */}

        <section
          style={{
            background:
              "#15151b",
            borderRadius:
              18,
            padding: 22,
            marginBottom:
              18,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              marginBottom:
                14,
            }}
          >
            2. Estilo do vídeo
          </h2>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: 10,
            }}
          >
            {[
              "UGC Real",
              "POV Real",
              "Showcase",
            ].map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setStyle(
                      item as VideoStyle
                    )
                  }
                  disabled={
                    loading
                  }
                  style={{
                    padding:
                      "14px 8px",
                    borderRadius:
                      12,
                    border:
                      style ===
                      item
                        ? "2px solid #fff"
                        : "1px solid #444",
                    background:
                      style ===
                      item
                        ? "#fff"
                        : "#202027",
                    color:
                      style ===
                      item
                        ? "#000"
                        : "#fff",
                    cursor:
                      loading
                        ? "not-allowed"
                        : "pointer",
                    fontWeight:
                      700,
                  }}
                >
                  {item}
                </button>
              )
            )}
          </div>
        </section>

        {/* ================= DURAÇÃO ================= */}

        <section
          style={{
            background:
              "#15151b",
            borderRadius:
              18,
            padding: 22,
            marginBottom:
              18,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              marginBottom:
                14,
            }}
          >
            3. Duração
          </h2>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: 10,
            }}
          >
            {[
              "4 segundos",
              "8 segundos",
              "12 segundos",
            ].map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setDuration(
                      item as Duration
                    )
                  }
                  disabled={
                    loading
                  }
                  style={{
                    padding:
                      14,
                    borderRadius:
                      12,
                    border:
                      duration ===
                      item
                        ? "2px solid #fff"
                        : "1px solid #444",
                    background:
                      duration ===
                      item
                        ? "#fff"
                        : "#202027",
                    color:
                      duration ===
                      item
                        ? "#000"
                        : "#fff",
                    cursor:
                      loading
                        ? "not-allowed"
                        : "pointer",
                    fontWeight:
                      700,
                  }}
                >
                  {item}
                </button>
              )
            )}
          </div>

          <p
            style={{
              color:
                "#777",
              fontSize: 12,
              marginTop:
                12,
              marginBottom: 0,
            }}
          >
            A API de vídeo
            atualmente aceita
            4, 8 ou 12 segundos.
          </p>
        </section>

        {/* ================= BOTÃO ================= */}

        <button
          type="button"
          onClick={
            generateVideo
          }
          disabled={
            loading ||
            !image
          }
          style={{
            width:
              "100%",
            padding:
              "18px",
            borderRadius:
              14,
            border:
              "none",
            background:
              loading ||
              !image
                ? "#444"
                : "#fff",
            color:
              loading ||
              !image
                ? "#aaa"
                : "#000",
            fontSize:
              18,
            fontWeight:
              900,
            cursor:
              loading ||
              !image
                ? "not-allowed"
                : "pointer",
          }}
        >
          {loading
            ? "GERANDO VÍDEO..."
            : "GERAR VÍDEO"}
        </button>

        {/* ================= STATUS ================= */}

        {status && (
          <div
            style={{
              marginTop:
                20,
              background:
                "#15151b",
              borderRadius:
                14,
              padding: 18,
            }}
          >
            <div
              style={{
                marginBottom:
                  10,
              }}
            >
              {status}
            </div>

            <div
              style={{
                height: 10,
                background:
                  "#292932",
                borderRadius:
                  10,
                overflow:
                  "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(
                    progress,
                    100
                  )}%`,
                  height:
                    "100%",
                  background:
                    "#fff",
                  transition:
                    "width 0.4s ease",
                }}
              />
            </div>

            <div
              style={{
                marginTop:
                  8,
                color:
                  "#aaa",
                fontSize:
                  13,
              }}
            >
              {Math.round(
                progress
              )}
              %
            </div>
          </div>
        )}

        {/* ================= ERRO ================= */}

        {error && (
          <div
            style={{
              marginTop:
                20,
              padding: 16,
              borderRadius:
                12,
              background:
                "#321719",
              color:
                "#ffb4b4",
            }}
          >
            {error}
          </div>
        )}

        {/* ================= VÍDEO ================= */}

        {videoUrl && (
          <section
            style={{
              marginTop:
                24,
              background:
                "#15151b",
              borderRadius:
                18,
              padding: 18,
            }}
          >
            <h2
              style={{
                fontSize:
                  20,
                marginBottom:
                  15,
              }}
            >
              Seu vídeo
              está pronto
            </h2>

            <video
              src={videoUrl}
              controls
              playsInline
              style={{
                width:
                  "100%",
                maxHeight:
                  700,
                borderRadius:
                  14,
                background:
                  "#000",
              }}
            />

            <a
              href={
                videoUrl
              }
              download="viralshop-video.mp4"
              style={{
                display:
                  "block",
                marginTop:
                  15,
                textAlign:
                  "center",
                padding:
                  15,
                borderRadius:
                  12,
                background:
                  "#fff",
                color:
                  "#000",
                textDecoration:
                  "none",
                fontWeight:
                  900,
              }}
            >
              BAIXAR VÍDEO
            </a>
          </section>
        )}

        {/* ================= PROMPT ================= */}

        {prompt && (
          <details
            style={{
              marginTop:
                20,
            }}
          >
            <summary
              style={{
                cursor:
                  "pointer",
                color:
                  "#aaa",
              }}
            >
              Ver prompt utilizado
            </summary>

            <pre
              style={{
                whiteSpace:
                  "pre-wrap",
                background:
                  "#15151b",
                padding: 15,
                borderRadius:
                  12,
                marginTop:
                  10,
                color:
                  "#bbb",
                fontSize:
                  12,
                overflowX:
                  "auto",
              }}
            >
              {prompt}
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}

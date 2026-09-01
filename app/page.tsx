"use client";

import { ChangeEvent, useState } from "react";

type VideoStyle = "UGC Real" | "POV Real" | "Showcase";
type Duration = "4 segundos" | "8 segundos" | "12 segundos";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [style, setStyle] = useState<VideoStyle>("UGC Real");
  const [duration, setDuration] = useState<Duration>("8 segundos");

  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result as string);
      setVideoUrl(null);
      setError("");
      setProgress(0);
      setStatus("");
    };

    reader.readAsDataURL(file);
  }

  function createPrompt() {
    if (style === "UGC Real") {
      return `
Criar um vídeo UGC extremamente realista para TikTok Shop.

Uma pessoa brasileira apresenta o produto de forma natural, espontânea e convincente.

O produto deve permanecer exatamente igual à imagem de referência.
Não alterar cor, formato, tamanho, textura, embalagem ou detalhes.

A gravação deve parecer feita por uma pessoa real usando um celular.
Movimentos naturais de câmera, mãos humanas reais, iluminação natural e ambiente cotidiano.

A pessoa deve falar em português do Brasil, com voz natural e tom de conversa.

Começar com uma frase forte e dinâmica nos primeiros segundos.
Mostrar o produto de perto e demonstrar sua utilização de forma natural.
Destacar benefícios reais sem fazer promessas exageradas.

Finalizar com uma chamada natural para conferir o produto no carrinho do TikTok Shop.

Não adicionar texto na tela.
Não adicionar legendas.
Não adicionar emojis.
Não criar mãos extras.
Não modificar o produto.
      `.trim();
    }

    if (style === "POV Real") {
      return `
Criar um vídeo POV extremamente realista para TikTok Shop.

A câmera deve parecer a visão de uma pessoa real segurando um celular.

Mostrar apenas ações humanas naturais e interação real com o produto.
O produto deve permanecer exatamente igual à imagem de referência.

Movimentos naturais das mãos e da câmera.
Iluminação realista.
Ambiente cotidiano.
Nada deve parecer publicidade artificial ou animação.

A pessoa deve falar em português do Brasil com voz espontânea e natural.

Começar imediatamente com um gancho forte.
Demonstrar o produto de maneira rápida e visual.
Mostrar por que ele chama atenção e quais são seus benefícios reais.

Finalizar incentivando a pessoa a conferir o produto no carrinho do TikTok Shop.

Não adicionar texto na tela.
Não adicionar legendas.
Não adicionar emojis.
Não criar mãos extras.
Não modificar cor, formato, textura ou embalagem do produto.
      `.trim();
    }

    return `
Criar um vídeo Showcase extremamente realista para TikTok Shop.

O produto deve ser o protagonista absoluto do vídeo.

Usar movimentos de câmera suaves e naturais, aproximando e afastando do produto para mostrar seus detalhes.

Manter o produto exatamente igual à imagem de referência.
Não alterar cor, formato, tamanho, textura, embalagem ou qualquer característica.

Criar aparência de gravação real feita com celular.
Iluminação natural e ambiente realista.

Mostrar detalhes importantes do produto e sua utilização de maneira visual e convincente.

Se houver fala, usar português do Brasil com voz humana natural.

O vídeo deve parecer conteúdo real de TikTok, não um comercial tradicional.

Finalizar mostrando claramente o produto e incentivando a pessoa a conferir o item no carrinho do TikTok Shop.

Não adicionar texto na tela.
Não adicionar legendas.
Não adicionar emojis.
Não criar mãos extras.
Não modificar o produto.
    `.trim();
  }

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
      const generatedPrompt = createPrompt();

      setPrompt(generatedPrompt);
      setStatus("Enviando produto para geração do vídeo...");

      const seconds = Number(duration.replace(" segundos", ""));

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
          data?.error || "Não foi possível iniciar a geração do vídeo."
        );
      }

      if (!data.id) {
        throw new Error("A API não retornou o ID do vídeo.");
      }

      const videoId = data.id;

      setStatus("Vídeo na fila de geração...");
      setProgress(data.progress ?? 0);

      let finished = false;
      let attempts = 0;

      while (!finished && attempts < 120) {
        attempts++;

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const statusResponse = await fetch(
          `/api/video?id=${encodeURIComponent(videoId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const statusData = await statusResponse.json();

        if (!statusResponse.ok) {
          throw new Error(
            statusData?.error || "Erro ao consultar o vídeo."
          );
        }

        setProgress(statusData.progress ?? 0);

        if (statusData.status === "completed") {
          finished = true;

          setStatus("Vídeo pronto!");
          setProgress(100);

          setVideoUrl(
            `/api/video?id=${encodeURIComponent(videoId)}&download=1`
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
          `Gerando vídeo... ${statusData.progress ?? 0}%`
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

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0b0f",
        color: "#fff",
        padding: "30px 16px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          ViralShop AI
        </h1>

        <p
          style={{
            color: "#aaa",
            marginBottom: 30,
          }}
        >
          Gere vídeos realistas para TikTok Shop
        </p>

        <section
          style={{
            background: "#15151b",
            borderRadius: 18,
            padding: 22,
            marginBottom: 18,
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>
            1. Foto do produto
          </h2>

          <label
            style={{
              display: "block",
              border: "2px dashed #444",
              borderRadius: 14,
              padding: 25,
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            {image ? (
              <img
                src={image}
                alt="Produto"
                style={{
                  maxWidth: "100%",
                  maxHeight: 350,
                  objectFit: "contain",
                  borderRadius: 12,
                }}
              />
            ) : (
              <span style={{ color: "#aaa" }}>
                Clique para enviar a foto do produto
              </span>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              style={{ display: "none" }}
            />
          </label>
        </section>

        <section
          style={{
            background: "#15151b",
            borderRadius: 18,
            padding: 22,
            marginBottom: 18,
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>
            2. Estilo do vídeo
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
            }}
          >
            {(["UGC Real", "POV Real", "Showcase"] as VideoStyle[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStyle(item)}
                  style={{
                    padding: "14px 8px",
                    borderRadius: 12,
                    border:
                      style === item
                        ? "2px solid #fff"
                        : "1px solid #444",
                    background:
                      style === item ? "#fff" : "#202027",
                    color:
                      style === item ? "#000" : "#fff",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  {item}
                </button>
              )
            )}
          </div>
        </section>

        <section
          style={{
            background: "#15151b",
            borderRadius: 18,
            padding: 22,
            marginBottom: 18,
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>
            3. Duração
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
            }}
          >
            {(
              ["4 segundos", "8 segundos", "12 segundos"] as Duration[]
            ).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setDuration(item)}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  border:
                    duration === item
                      ? "2px solid #fff"
                      : "1px solid #444",
                  background:
                    duration === item ? "#fff" : "#202027",
                  color:
                    duration === item ? "#000" : "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={generateVideo}
          disabled={loading || !image}
          style={{
            width: "100%",
            padding: "18px",
            borderRadius: 14,
            border: "none",
            background:
              loading || !image ? "#444" : "#fff",
            color:
              loading || !image ? "#aaa" : "#000",
            fontSize: 18,
            fontWeight: 800,
            cursor:
              loading || !image
                ? "not-allowed"
                : "pointer",
          }}
        >
          {loading ? "GERANDO VÍDEO..." : "🚀 GERAR VÍDEO"}
        </button>

        {status && (
          <div
            style={{
              marginTop: 20,
              background: "#15151b",
              borderRadius: 14,
              padding: 18,
            }}
          >
            <div style={{ marginBottom: 10 }}>
              {status}
            </div>

            <div
              style={{
                height: 10,
                background: "#292932",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  height: "100%",
                  background: "#fff",
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            <div
              style={{
                marginTop: 8,
                color: "#aaa",
                fontSize: 13,
              }}
            >
              {progress}%
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 12,
              background: "#321719",
              color: "#ffb4b4",
            }}
          >
            {error}
          </div>
        )}

        {videoUrl && (
          <section
            style={{
              marginTop: 24,
              background: "#15151b",
              borderRadius: 18,
              padding: 18,
            }}
          >
            <h2
              style={{
                fontSize: 20,
                marginBottom: 15,
              }}
            >
              Seu vídeo está pronto
            </h2>

            <video
              src={videoUrl}
              controls
              playsInline
              style={{
                width: "100%",
                maxHeight: 700,
                borderRadius: 14,
                background: "#000",
              }}
            />

            <a
              href={videoUrl}
              download="viralshop-video.mp4"
              style={{
                display: "block",
                marginTop: 15,
                textAlign: "center",
                padding: 15,
                borderRadius: 12,
                background: "#fff",
                color: "#000",
                textDecoration: "none",
                fontWeight: 800,
              }}
            >
              BAIXAR VÍDEO
            </a>
          </section>
        )}

        {prompt && (
          <details style={{ marginTop: 20 }}>
            <summary
              style={{
                cursor: "pointer",
                color: "#aaa",
              }}
            >
              Ver prompt utilizado
            </summary>

            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "#15151b",
                padding: 15,
                borderRadius: 12,
                marginTop: 10,
                color: "#bbb",
                fontSize: 12,
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

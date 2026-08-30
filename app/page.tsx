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
    };

    reader.readAsDataURL(file);
  }

  function createPrompt() {
    const seconds = duration.replace(" segundos", "");

    return `
VIRALSHOP AI — ${style.toUpperCase()}

Criar vídeo vertical 9:16.

DURAÇÃO EXATA: ${seconds} segundos.

A FOTO ENVIADA É A REFERÊNCIA ABSOLUTA DO PRODUTO.

O produto deve permanecer visualmente IDÊNTICO à imagem durante todo o vídeo.

Não alterar:
- cor
- formato
- textura
- tamanho
- proporções
- materiais
- detalhes
- embalagem
- acessórios

Não trocar o produto.
Não redesenhar o produto.
Não inventar outro produto.
Não duplicar o produto.
Não deformar o produto.

A mesma referência deve ser respeitada do primeiro ao último frame.

${style === "UGC Real"
  ? `
ESTILO UGC REAL

Uma única mulher brasileira apresenta o produto como uma criadora real de TikTok.

Aparência natural.
Anatomia humana realista.
Duas mãos normais.
Cinco dedos em cada mão.
Sem dedos extras.
Sem mãos duplicadas.
Sem braços duplicados.

A câmera deve parecer um celular sendo segurado por uma pessoa real.

Movimentos naturais e simples.

UMA ÚNICA VOZ FEMININA.

Fala em português brasileiro.
Tom natural.
Conversacional.
Espontâneo.
Confiante.
Dinâmico.

Criar uma fala curta com:
GANCHO + BENEFÍCIO REAL + CTA.

A fala deve ser rápida e natural.
Não falar como locutora de propaganda.
Não usar pausas artificiais.

A modelo deve parecer estar mostrando um achado para uma amiga.

Começar mostrando o produto imediatamente.

O produto precisa estar claramente visível durante a fala.

Finalizar com um gesto natural indicando o carrinho.

Sem texto na tela.
Sem legendas.
Sem segunda voz.
Sem narrador.
Sem pessoa adicional.
`
  : style === "POV Real"
  ? `
ESTILO POV REAL

Criar uma gravação POV extremamente realista.

A câmera deve parecer a visão de uma pessoa usando um celular.

Mostrar o produto imediatamente.

Mãos humanas realistas.
Movimentos naturais.
Anatomia correta.
Cinco dedos em cada mão.
Sem dedos extras.
Sem mãos duplicadas.
Sem deformações.

Caso exista fala:
UMA ÚNICA VOZ brasileira.
Fala curta.
Natural.
Dinâmica.
Sem narrador.
Sem segunda voz.

Sem texto na tela.
Sem legendas.
Sem efeitos exagerados.

Prioridade máxima:
produto idêntico à referência + movimento natural + aparência de gravação real.
`
  : `
ESTILO SHOWCASE REAL

Mostrar o produto de forma extremamente realista.

Movimentos suaves de câmera.
Foco nos detalhes reais do produto.

O produto deve permanecer idêntico à referência.

Não transformar o produto.
Não modificar materiais.
Não criar objetos inexistentes.
Não duplicar o produto.

Caso exista fala:
UMA ÚNICA VOZ brasileira.
Natural.
Curta.
Dinâmica.
Sem narrador.
Sem segunda voz.

Sem texto na tela.
Sem legendas.
`
}

PRIORIDADES:

1. Fidelidade absoluta ao produto.
2. Anatomia humana correta.
3. Movimento fisicamente realista.
4. Aparência de vídeo gravado por uma pessoa real.
5. Português brasileiro.
6. Fala natural e dinâmica.
7. Produto visível durante o vídeo.
8. Nenhum texto ou legenda na tela.

Não inventar características ou benefícios que não possam ser confirmados pela imagem do produto.
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
    setStatus("Criando prompt...");

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
        throw new Error(data?.error || "Não foi possível iniciar o vídeo.");
      }

      if (!data.id) {
        throw new Error("A API não retornou o ID do vídeo.");
      }

      const videoId = data.id;

      setStatus("Vídeo na fila de geração...");
      setProgress(data.progress ?? 0);

      let finished = false;

      while (!finished) {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const statusResponse = await fetch(
          `/api/video?id=${encodeURIComponent(videoId)}`,
          {
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

          setVideoUrl(
            `/api/video?id=${encodeURIComponent(videoId)}&download=1`
          );
        }

        if (statusData.status === "failed") {
          throw new Error(
            statusData?.error || "A geração do vídeo falhou."
          );
        }

        if (statusData.status === "queued") {
          setStatus("Vídeo na fila...");
        }

        if (statusData.status === "in_progress") {
          setStatus(
            `Gerando vídeo... ${Math.round(statusData.progress ?? 0)}%`
          );
        }
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
    <main className="app">
      <header className="header">
        <div>
          <div className="logo">ViralShop AI</div>
          <p>Seu criador de vídeos para TikTok Shop</p>
        </div>

        <div className="version">V1.3</div>
      </header>

      <section className="hero">
        <h1>Crie seu próximo vídeo viral.</h1>

        <p>
          Envie o produto, escolha o estilo e gere seu vídeo automaticamente.
        </p>
      </section>

      <section className="workspace">
        <div className="card upload-card">
          <h2>1. Produto</h2>

          <label className="upload">
            {image ? (
              <img src={image} alt="Produto enviado" />
            ) : (
              <>
                <span className="upload-icon">+</span>
                <strong>Enviar foto do produto</strong>
                <small>PNG, JPG ou WEBP</small>
              </>
            )}

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImage}
            />
          </label>
        </div>

        <div className="card">
          <h2>2. Estilo do vídeo</h2>

          <div className="options">
            {(["UGC Real", "POV Real", "Showcase"] as VideoStyle[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  className={
                    style === item ? "option active" : "option"
                  }
                  onClick={() => setStyle(item)}
                  disabled={loading}
                >
                  {item}
                </button>
              )
            )}
          </div>
        </div>

        <div className="card">
          <h2>3. Duração</h2>

          <div className="duration">
            {(["4 segundos", "8 segundos", "12 segundos"] as Duration[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  className={
                    duration === item
                      ? "duration-btn active"
                      : "duration-btn"
                  }
                  onClick={() => setDuration(item)}
                  disabled={loading}
                >
                  {item}
                </button>
              )
            )}
          </div>
        </div>

        <button
          className="generate"
          type="button"
          onClick={generateVideo}
          disabled={loading}
        >
          {loading ? "GERANDO VÍDEO..." : "GERAR VÍDEO"}
        </button>

        {status && (
          <div className="card">
            <h2>{status}</h2>

            {loading && (
              <div>
                <p>{Math.round(progress)}%</p>

                <progress
                  value={progress}
                  max="100"
                  style={{ width: "100%" }}
                />
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="card">
            <h2>Erro</h2>
            <p>{error}</p>
          </div>
        )}

        {videoUrl && (
          <div className="card result">
            <div className="result-header">
              <h2>Seu vídeo está pronto</h2>
            </div>

            <video
              src={videoUrl}
              controls
              playsInline
              style={{
                width: "100%",
                maxWidth: "420px",
                borderRadius: "16px",
              }}
            />

            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="generate"
              style={{
                display: "block",
                textAlign: "center",
                textDecoration: "none",
                marginTop: "16px",
              }}
            >
              ABRIR VÍDEO
            </a>
          </div>
        )}

        {prompt && (
          <div className="card result">
            <div className="result-header">
              <h2>Prompt utilizado</h2>

              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(prompt)}
                className="copy"
              >
                Copiar
              </button>
            </div>

            <pre>{prompt}</pre>
          </div>
        )}
      </section>

      <footer>
        ViralShop AI · Criado para acelerar sua produção de TikTok Shop
      </footer>
    </main>
  );
}

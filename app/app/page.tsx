"use client";

import { ChangeEvent, useState } from "react";

type VideoStyle = "UGC Real" | "POV Real" | "Showcase";
type Duration = "8 segundos" | "16 segundos" | "24 segundos";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [style, setStyle] = useState<VideoStyle>("UGC Real");
  const [duration, setDuration] = useState<Duration>("8 segundos");
  const [prompt, setPrompt] = useState("");

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result as string);
    };

    reader.readAsDataURL(file);
  }

  function generatePrompt() {
    const generated = `
VIRALSHOP AI — PROMPT V1

Estilo: ${style}
Duração: ${duration}

Criar um vídeo vertical 9:16, ultra-realista, com aparência de gravação real para TikTok Shop.

Usar a imagem enviada como referência principal do produto.
Manter o produto fiel à referência, sem alterar cor, formato, textura, proporções ou detalhes.

O vídeo deve parecer espontâneo e natural, sem aparência de publicidade tradicional.

${style === "UGC Real"
        ? "Uma criadora brasileira apresenta o produto de maneira natural, falando diretamente com a câmera."
        : style === "POV Real"
        ? "Criar uma experiência POV realista, como se o espectador estivesse vendo o produto através dos próprios olhos."
        : "Criar um showcase realista, mantendo o produto como protagonista e evitando manipulações desnecessárias."
      }

A fala deve ser brasileira, natural, dinâmica e contínua.
A voz deve parecer uma pessoa real conversando, sem ritmo robótico ou pausas artificiais.

Incluir um CTA natural direcionando a pessoa para o carrinho do TikTok Shop.

Não utilizar texto na tela.
Não utilizar segunda voz.
Não utilizar narrador externo.
Não alterar o produto.

Priorizar realismo, fidelidade do produto e movimento natural.
    `.trim();

    setPrompt(generated);
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <div className="logo">ViralShop AI</div>
          <p>Seu criador de vídeos para TikTok Shop</p>
        </div>

        <div className="version">V1.0</div>
      </header>

      <section className="hero">
        <h1>Crie seu próximo vídeo viral.</h1>

        <p>
          Envie o produto, escolha o estilo e deixe o ViralShop AI preparar
          seu prompt.
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
                  className={style === item ? "option active" : "option"}
                  onClick={() => setStyle(item)}
                >
                  <span>
                    {item === "UGC Real"
                      ? "👩"
                      : item === "POV Real"
                      ? "📱"
                      : "✨"}
                  </span>

                  {item}
                </button>
              )
            )}
          </div>
        </div>

        <div className="card">
          <h2>3. Duração</h2>

          <div className="duration">
            {(["8 segundos", "16 segundos", "24 segundos"] as Duration[]).map(
              (item) => (
                <button
                  key={item}
                  className={
                    duration === item ? "duration-btn active" : "duration-btn"
                  }
                  onClick={() => setDuration(item)}
                >
                  {item}
                </button>
              )
            )}
          </div>
        </div>

        <button className="generate" onClick={generatePrompt}>
          🚀 GERAR PROMPT
        </button>

        {prompt && (
          <div className="card result">
            <div className="result-header">
              <h2>Seu prompt está pronto</h2>

              <button
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

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
    let promptText = "";

    if (style === "UGC Real") {
      promptText = `
VIRALSHOP AI — UGC REAL

CRIAR VÍDEO VERTICAL 9:16.
DURAÇÃO EXATA: ${duration}.

REGRA MAIS IMPORTANTE:
A FOTO ENVIADA É A REFERÊNCIA ABSOLUTA DO PRODUTO.

O produto precisa permanecer visualmente IDÊNTICO à imagem de referência durante todo o vídeo.

NÃO modificar o produto.
NÃO redesenhar o produto.
NÃO trocar o produto.
NÃO alterar formato.
NÃO alterar cor.
NÃO alterar textura.
NÃO alterar tamanho ou proporção.
NÃO adicionar detalhes.
NÃO remover detalhes.
NÃO criar acessórios diferentes.
NÃO duplicar o produto.

Se a imagem mostrar um relógio, usar EXATAMENTE aquele relógio.
Se a imagem mostrar joias junto ao relógio, manter EXATAMENTE aquelas joias.
Não inventar outro relógio.
Não inventar outras joias.

CONTINUIDADE:
O mesmo produto permanece na cena do início ao fim.
O produto não pode se transformar entre frames.
O produto não pode mudar de posição de maneira impossível.
Não gerar objetos duplicados.

MODELO:
Aparece UMA ÚNICA mulher brasileira.
Ela é a única pessoa da cena.
Ela fala diretamente com a câmera como uma criadora real de TikTok.

CORPO E MÃOS:
Anatomia humana realista.
Duas mãos normais.
Cinco dedos em cada mão.
Sem dedos extras.
Sem mãos duplicadas.
Sem braços duplicados.
Sem mãos torcidas.
Sem deformações.

MOVIMENTO:
Movimentos simples e naturais.
A modelo segura o produto de maneira fisicamente correta.
Nada de movimentos rápidos ou impossíveis.
Câmera parecida com celular gravando um vídeo real.
Pequenas movimentações naturais da câmera.

VOZ:
UMA ÚNICA VOZ FEMININA.
A mesma voz durante todo o vídeo.
Nenhuma segunda voz.
Nenhum narrador.
Nenhuma voz masculina.
Nenhum eco.
Nenhuma troca de voz.

FALA:
Português brasileiro.
Tom de conversa.
Natural.
Espontâneo.
Confiante.
Dinâmico.

Para 8 segundos, usar UMA frase curta de aproximadamente 16 a 20 palavras.

A fala NÃO pode ser arrastada.
A fala NÃO pode ser lenta.
A fala NÃO pode ter pausas artificiais.
Não separar cada palavra.
Não falar como locutora de propaganda.

A modelo deve falar como se estivesse mostrando um achado para uma amiga.

ESTRUTURA DA FALA:
Gancho rápido + benefício real visível + CTA curto.

IMPORTANTE:
Não inventar benefícios que não possam ser confirmados pela imagem ou descrição do produto.

EXEMPLO DE RITMO:
"Gente, olha esse relógio! O conjunto é lindo e combina com tudo. Eu já colocaria no carrinho!"

Usar o exemplo somente como referência de ritmo.
Adaptar a fala ao produto real.

SINCRONIZAÇÃO:
A boca deve acompanhar exatamente a fala.
A voz começa junto com a ação.
A fala termina antes do final do vídeo.
Não deixar silêncio longo.

CENA:
Começar mostrando a modelo e o produto imediatamente.
Produto claramente visível nos primeiros segundos.
A modelo apresenta o produto de forma espontânea.
Finalizar com um gesto natural indicando o carrinho.

SEM:
Texto na tela.
Legendas.
Segunda pessoa.
Segunda voz.
Narrador.
Produto diferente.
Produto duplicado.
Mãos deformadas.
Dedos extras.
Mudança de cor.
Mudança de formato.
Mudança de textura.
Movimentos impossíveis.

PRIORIDADE:
1. Fidelidade absoluta ao produto.
2. Anatomia correta.
3. Uma única modelo.
4. Uma única voz.
5. Fala rápida e natural.
6. Aparência de vídeo UGC real.
`.trim();
    } else if (style === "POV Real") {
      promptText = `
VIRALSHOP AI — POV REAL

Vídeo vertical 9:16.
Duração: ${duration}.

A imagem enviada é a referência absoluta do produto.

Manter o produto exatamente igual à referência:
mesma cor, formato, textura, tamanho, proporções e detalhes.

Não alterar o produto.
Não duplicar o produto.
Não inventar acessórios.
Não deformar o produto.

Criar uma gravação POV extremamente realista, como se uma pessoa estivesse segurando e mostrando o produto usando um celular.

Movimentos naturais de mão.
Anatomia correta.
Sem dedos extras.
Sem mãos duplicadas.
Sem torções.

UMA ÚNICA VOZ humana brasileira, caso exista fala.
Sem narrador.
Sem segunda voz.

Fala curta, natural e dinâmica.
Nada de fala lenta ou arrastada.

Começar mostrando o produto imediatamente.

Sem texto na tela.
Sem legendas.
Sem efeitos exagerados.

Prioridade máxima:
produto idêntico à referência + movimento realista + aparência de vídeo gravado por uma pessoa.
`.trim();
    } else {
      promptText = `
VIRALSHOP AI — SHOWCASE REAL

Vídeo vertical 9:16.
Duração: ${duration}.

Usar a imagem enviada como referência absoluta.

O produto deve permanecer IDÊNTICO durante todo o vídeo.

Não modificar:
cor,
formato,
textura,
tamanho,
proporções,
materiais,
detalhes ou acessórios.

Não duplicar o produto.
Não deformar o produto.
Não criar versões diferentes do produto.

Mostrar o produto com movimentos de câmera suaves e fisicamente realistas.

Foco nos detalhes reais do produto.

Sem transformações.
Sem efeitos que alterem o produto.
Sem texto na tela.
Sem objetos inventados.

Se houver fala:
UMA ÚNICA VOZ brasileira.
Natural.
Curta.
Dinâmica.
Sem narrador.
Sem segunda voz.
Sem fala lenta.

Prioridade máxima:
fidelidade visual absoluta + movimento natural + aparência de gravação real.
`.trim();
    }

    setPrompt(promptText);
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <div className="logo">ViralShop AI</div>
          <p>Seu criador de vídeos para TikTok Shop</p>
        </div>

        <div className="version">V1.2</div>
      </header>

      <section className="hero">
        <h1>Crie seu próximo vídeo viral.</h1>

        <p>
          Envie o produto, escolha o estilo e gere um prompt focado em
          realismo, fidelidade e conversão.
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
                    duration === item
                      ? "duration-btn active"
                      : "duration-btn"
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


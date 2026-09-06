import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const BASE = "https://api.openai.com/v1/videos";

export async function POST(req: NextRequest) {
  try {
    const key = process.env.OPENAI_API_KEY;

    if (!key) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY não configurada na Vercel.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    const image = body?.image;
    const prompt = body?.prompt;
    const seconds = String(body?.seconds ?? "8");

    if (!image) {
      return NextResponse.json(
        {
          error: "A foto do produto não foi enviada.",
        },
        { status: 400 }
      );
    }

    if (!["4", "8", "12"].includes(seconds)) {
      return NextResponse.json(
        {
          error: "A duração deve ser 4, 8 ou 12 segundos.",
        },
        { status: 400 }
      );
    }

    /*
     * A imagem chega do page.tsx como Data URL:
     *
     * data:image/png;base64,....
     *
     * Vamos transformar qualquer imagem recebida
     * em EXATAMENTE 720x1280 antes de enviar
     * para a API de vídeos.
     */

    const match = image.match(
      /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/
    );

    if (!match) {
      return NextResponse.json(
        {
          error:
            "Formato da imagem inválido. Use PNG, JPG, JPEG ou WEBP.",
        },
        { status: 400 }
      );
    }

    const base64Data = match[2];

    const originalBuffer = Buffer.from(
      base64Data,
      "base64"
    );

    /*
     * ==========================================
     * CONVERSÃO OBRIGATÓRIA PARA 720x1280
     * ==========================================
     *
     * fit: contain
     *
     * Mantém o produto inteiro dentro da imagem.
     * Se a foto original tiver outro formato,
     * adicionamos espaço ao redor em vez de cortar.
     */

    const resizedBuffer = await sharp(originalBuffer)
      .resize(720, 1280, {
        fit: "contain",
        background: {
          r: 255,
          g: 255,
          b: 255,
          alpha: 1,
        },
      })
      .png()
      .toBuffer();

    /*
     * A imagem final agora é:
     *
     * 720 x 1280
     * PNG
     * proporção 9:16
     */

    const imageBlob = new Blob(
      [resizedBuffer],
      {
        type: "image/png",
      }
    );

    const form = new FormData();

    /*
     * MODELO
     */

    form.append(
      "model",
      "sora-2"
    );

    /*
     * PROMPT
     */

    form.append(
      "prompt",
      prompt ||
        "Create a realistic vertical TikTok Shop product video using the reference image. Preserve the exact product appearance. Natural human interaction, realistic movement, Brazilian Portuguese speech when appropriate. End with a natural call to action inviting the viewer to tap the orange shopping cart."
    );

    /*
     * DURAÇÃO
     */

    form.append(
      "seconds",
      seconds
    );

    /*
     * TAMANHO DO VÍDEO
     */

    form.append(
      "size",
      "720x1280"
    );

    /*
     * ==========================================
     * IMAGEM DE REFERÊNCIA
     * ==========================================
     *
     * Sempre enviamos o PNG convertido
     * para exatamente 720x1280.
     */

    form.append(
      "input_reference",
      imageBlob,
      "produto-720x1280.png"
    );

    /*
     * ENVIA PARA A API
     */

    const response = await fetch(
      BASE,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
        },
        body: form,
      }
    );

    const data = await response.json();

    /*
     * TRATAMENTO DE ERRO
     */

    if (!response.ok) {
      console.error(
        "OPENAI VIDEO ERROR:",
        data
      );

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Falha ao iniciar a geração do vídeo.",
        },
        {
          status: response.status,
        }
      );
    }

    /*
     * RETORNA ID PARA O page.tsx
     */

    return NextResponse.json({
      id: data.id,
      status: data.status,
      progress: data.progress ?? 0,
    });
  } catch (error) {
    console.error(
      "VIDEO POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao criar o vídeo.",
      },
      { status: 500 }
    );
  }
}

/*
 * ==========================================
 * GET
 * ==========================================
 *
 * Consulta o andamento do vídeo
 * e permite baixar o MP4.
 */

export async function GET(
  req: NextRequest
) {
  try {
    const key =
      process.env.OPENAI_API_KEY;

    if (!key) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY não configurada na Vercel.",
        },
        { status: 500 }
      );
    }

    const id =
      req.nextUrl.searchParams.get(
        "id"
      );

    const download =
      req.nextUrl.searchParams.get(
        "download"
      ) === "1";

    if (!id) {
      return NextResponse.json(
        {
          error:
            "ID do vídeo não informado.",
        },
        { status: 400 }
      );
    }

    /*
     * ==========================================
     * DOWNLOAD DO MP4
     * ==========================================
     */

    if (download) {
      const contentResponse =
        await fetch(
          `${BASE}/${encodeURIComponent(
            id
          )}/content`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${key}`,
            },
            cache: "no-store",
          }
        );

      if (!contentResponse.ok) {
        const errorText =
          await contentResponse.text();

        let errorMessage =
          "Não foi possível baixar o vídeo.";

        try {
          const errorData =
            JSON.parse(errorText);

          errorMessage =
            errorData?.error?.message ||
            errorMessage;
        } catch {
          if (errorText) {
            errorMessage =
              errorText;
          }
        }

        return NextResponse.json(
          {
            error: errorMessage,
          },
          {
            status:
              contentResponse.status,
          }
        );
      }

      return new Response(
        contentResponse.body,
        {
          status: 200,
          headers: {
            "Content-Type":
              contentResponse.headers.get(
                "content-type"
              ) ||
              "video/mp4",

            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    /*
     * ==========================================
     * CONSULTAR STATUS
     * ==========================================
     */

    const response =
      await fetch(
        `${BASE}/${encodeURIComponent(
          id
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${key}`,
          },
          cache: "no-store",
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Falha ao consultar o vídeo.",
        },
        {
          status:
            response.status,
        }
      );
    }

    return NextResponse.json({
      id: data.id,
      status: data.status,
      progress:
        data.progress ?? 0,
      error:
        data.error?.message ??
        null,
    });
  } catch (error) {
    console.error(
      "VIDEO GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado.",
      },
      { status: 500 }
    );
  }
}

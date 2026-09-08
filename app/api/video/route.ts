import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const BASE = "https://api.openai.com/v1/videos";

const ALLOWED_SECONDS = ["4", "8", "12"];

export async function POST(req: NextRequest) {
  try {
    const key = process.env.OPENAI_API_KEY;

    if (!key) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY não configurada na Vercel.",
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

    if (!ALLOWED_SECONDS.includes(seconds)) {
      return NextResponse.json(
        {
          error:
            "A duração escolhida não é suportada. Use 4, 8 ou 12 segundos.",
        },
        { status: 400 }
      );
    }

    /*
     * ==========================================
     * VALIDAR DATA URL
     * ==========================================
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
     * PREPARAR IMAGEM
     * ==========================================
     *
     * A API recebe uma referência vertical
     * exatamente em 720x1280.
     *
     * O produto não é cortado.
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

    const imageBlob = new Blob(
      [resizedBuffer],
      {
        type: "image/png",
      }
    );

    /*
     * ==========================================
     * PROMPT PADRÃO
     * ==========================================
     */

    const finalPrompt =
      typeof prompt === "string" && prompt.trim()
        ? prompt.trim()
        : `
Create an ultra-realistic vertical TikTok Shop product video.

Use the provided image as the exact product reference.

Preserve the product exactly as shown.

Do not change:
- color
- shape
- proportions
- texture
- packaging
- logo
- labels
- product details

Use realistic Brazilian human behavior and natural camera movement.

If there is dialogue, speak naturally in Brazilian Portuguese.

The video must look like authentic user-generated content recorded with a real smartphone.

Do not add captions.
Do not add subtitles.
Do not add text overlays.
Do not add emojis.
Do not create extra hands.
Do not distort the product.

End with a natural invitation to check the product on TikTok Shop.
      `.trim();

    /*
     * ==========================================
     * FORM DATA
     * ==========================================
     */

    const form = new FormData();

    form.append("model", "sora-2");

    form.append(
      "prompt",
      finalPrompt
    );

    form.append(
      "seconds",
      seconds
    );

    form.append(
      "size",
      "720x1280"
    );

    form.append(
      "input_reference",
      imageBlob,
      "produto-720x1280.png"
    );

    /*
     * ==========================================
     * ENVIAR PARA OPENAI
     * ==========================================
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
     * ==========================================
     * ERRO DA API
     * ==========================================
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

    if (!data?.id) {
      return NextResponse.json(
        {
          error:
            "A OpenAI não retornou o ID do vídeo.",
        },
        { status: 500 }
      );
    }

    /*
     * ==========================================
     * RETORNO
     * ==========================================
     */

    return NextResponse.json({
      id: data.id,
      status: data.status,
      progress: data.progress ?? 0,
      seconds: data.seconds ?? seconds,
      size: data.size ?? "720x1280",
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
 * GET /api/video?id=VIDEO_ID
 *
 * Consulta o status.
 *
 * GET /api/video?id=VIDEO_ID&download=1
 *
 * Faz o download/stream do MP4.
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
     * DOWNLOAD
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
            errorMessage = errorText;
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

            "Content-Disposition":
              'inline; filename="viralshop-video.mp4"',

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
      seconds: data.seconds ?? null,
      size: data.size ?? null,
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

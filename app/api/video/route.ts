import { NextRequest, NextResponse } from "next/server";

const BASE = "https://api.openai.com/v1/videos";

export async function POST(req: NextRequest) {
  try {
    const key = process.env.OPENAI_API_KEY;

    if (!key) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY não configurada na Vercel." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const image = body?.image;
    const prompt = body?.prompt;
    const seconds = String(body?.seconds ?? 8);

    if (!image) {
      return NextResponse.json(
        { error: "Envie a foto do produto." },
        { status: 400 }
      );
    }

    if (!["4", "8", "12"].includes(seconds)) {
      return NextResponse.json(
        { error: "A duração deve ser 4, 8 ou 12 segundos." },
        { status: 400 }
      );
    }

    /*
     * A imagem chega do page.tsx como Data URL:
     * data:image/png;base64,....
     *
     * A API de vídeos precisa receber a referência
     * como arquivo multipart/form-data.
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

    const mimeType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
    const base64Data = match[2];

    const buffer = Buffer.from(base64Data, "base64");

    const imageBlob = new Blob([buffer], {
      type: mimeType,
    });

    const form = new FormData();

    form.append("model", "sora-2");

    form.append(
      "prompt",
      prompt ||
        "Create a realistic vertical TikTok Shop product video using the reference image. Preserve the exact product appearance. Natural human interaction, realistic movement, Brazilian Portuguese speech when appropriate. End with a natural call to action inviting the viewer to tap the orange shopping cart."
    );

    form.append("seconds", seconds);
    form.append("size", "720x1280");

    form.append(
      "input_reference",
      imageBlob,
      mimeType === "image/webp"
        ? "produto.webp"
        : mimeType === "image/png"
        ? "produto.png"
        : "produto.jpg"
    );

    const response = await fetch(BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
      },
      body: form,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Falha ao iniciar a geração do vídeo.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      id: data.id,
      status: data.status,
      progress: data.progress ?? 0,
    });
  } catch (error) {
    console.error("VIDEO POST ERROR:", error);

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

export async function GET(req: NextRequest) {
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

    const id = req.nextUrl.searchParams.get("id");
    const download =
      req.nextUrl.searchParams.get("download") === "1";

    if (!id) {
      return NextResponse.json(
        {
          error: "ID do vídeo não informado.",
        },
        { status: 400 }
      );
    }

    /*
     * DOWNLOAD DO MP4
     */

    if (download) {
      const contentResponse = await fetch(
        `${BASE}/${encodeURIComponent(id)}/content`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${key}`,
          },
          cache: "no-store",
        }
      );

      if (!contentResponse.ok) {
        const errorText = await contentResponse.text();

        let errorMessage =
          "Não foi possível baixar o vídeo.";

        try {
          const errorData = JSON.parse(errorText);

          errorMessage =
            errorData?.error?.message ||
            errorMessage;
        } catch {
          if (errorText) {
            errorMessage = errorText;
          }
        }

        return NextResponse.json(
          { error: errorMessage },
          { status: contentResponse.status }
        );
      }

      return new Response(contentResponse.body, {
        status: 200,
        headers: {
          "Content-Type":
            contentResponse.headers.get("content-type") ||
            "video/mp4",
          "Cache-Control": "no-store",
        },
      });
    }

    /*
     * CONSULTA DO STATUS
     */

    const response = await fetch(
      `${BASE}/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${key}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Falha ao consultar o vídeo.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      id: data.id,
      status: data.status,
      progress: data.progress ?? 0,
      error: data.error?.message ?? null,
    });
  } catch (error) {
    console.error("VIDEO GET ERROR:", error);

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

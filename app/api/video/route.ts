import { NextRequest, NextResponse } from "next/server";

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
    const seconds = String(body?.seconds ?? 8);

    if (!image) {
      return NextResponse.json(
        {
          error: "Envie a foto do produto.",
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

    const response = await fetch(BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sora-2",
        prompt:
          prompt ||
          "Crie um vídeo vertical realista usando a imagem enviada como referência.",
        seconds,
        size: "720x1280",
        input_reference: {
          image_url: image,
        },
      }),
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
     *
     * Quando o page.tsx chama:
     *
     * /api/video?id=VIDEO_ID&download=1
     *
     * buscamos o conteúdo do vídeo na OpenAI
     * e devolvemos o MP4 para o navegador.
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
          {
            error: errorMessage,
          },
          {
            status: contentResponse.status,
          }
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

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

    const { image, prompt, seconds = 8 } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "Envie a foto do produto." },
        { status: 400 }
      );
    }

    const res = await fetch(BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sora-2",
        prompt,
        seconds: String(seconds),
        size: "720x1280",
        input_reference: {
          image_url: image,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message || "Falha ao iniciar o vídeo.",
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      id: data.id,
      status: data.status,
      progress: data.progress ?? 0,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Erro inesperado.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const key = process.env.OPENAI_API_KEY;
    const id = req.nextUrl.searchParams.get("id");

    if (!key || !id) {
      return NextResponse.json(
        { error: "Configuração ou ID ausente." },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${BASE}/${encodeURIComponent(id)}`,
      {
        headers: {
          Authorization: `Bearer ${key}`,
        },
        cache: "no-store",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Falha ao consultar vídeo.",
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      id: data.id,
      status: data.status,
      progress: data.progress ?? 0,
      error: data.error?.message ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Erro inesperado.",
      },
      { status: 500 }
    );
  }
}

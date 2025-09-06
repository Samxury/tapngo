import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');
  const symbol = searchParams.get('symbol');

  if (!source || !symbol) {
    return NextResponse.json(
      { error: 'Missing required parameters: source and symbol' },
      { status: 400 }
    );
  }

  let apiUrl: string;

  try {
    switch (source) {
      case 'binance':
        apiUrl = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
        break;
      case 'coingecko':
        if (symbol === 'USDCGHS') {
          apiUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=ghs';
        } else {
          return NextResponse.json(
            { error: 'Unsupported symbol for CoinGecko' },
            { status: 400 }
          );
        }
        break;
      case 'coinbase':
        apiUrl = 'https://api.coinbase.com/v2/exchange-rates?currency=USDC';
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported source' },
          { status: 400 }
        );
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Pricing proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing data' },
      { status: 500 }
    );
  }
}

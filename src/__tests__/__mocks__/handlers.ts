// MSW (Mock Service Worker) handlers for API requests
import { http, HttpResponse } from 'msw';

export const handlers = [
  // 汇率API Mock - 主API
  http.get('https://api.exchangerate-api.com/v4/latest/USD', () => {
    return HttpResponse.json({
      rates: {
        CNY: 7.2,
        EUR: 0.85,
        JPY: 110.0
      },
      date: '2024-01-01'
    });
  }),

  // 备用汇率API Mock
  http.get('https://api.frankfurter.app/latest', ({ request }) => {
    const url = new URL(request.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    if (from === 'USD' && to === 'CNY') {
      return HttpResponse.json({
        amount: 1,
        base: 'USD',
        date: '2024-01-01',
        rates: {
          CNY: 7.2
        }
      });
    }

    return HttpResponse.json({
      amount: 1,
      base: from,
      date: '2024-01-01',
      rates: {}
    });
  }),
];

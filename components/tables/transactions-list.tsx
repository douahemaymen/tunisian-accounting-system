'use client';



const mockTransactions = [
  {
    id: '1',
    company: 'Airbnb',
    type: 'Virement',
    amount: -1562.00,
    date: '12 janv. 2025',
    status: 'completed',
    icon: '🏠'
  },
  {
    id: '2',
    company: 'Google Ads',
    type: 'Virement',
    amount: -14.00,
    date: '11 janv. 2025',
    status: 'completed',
    icon: '📱'
  },
  {
    id: '3',
    company: 'Maison2&K',
    type: 'Virement',
    amount: -32.00,
    date: '11 janv. 2025',
    status: 'completed',
    icon: '🏪'
  },
  {
    id: '4',
    company: 'Uber',
    type: 'Virement',
    amount: 35.00,
    date: '10 janv. 2025',
    status: 'completed',
    icon: '🚗'
  },
];

export function TransactionsList() {
  return (
    <div className="space-y-4">
      {mockTransactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
              <span className="text-lg">{transaction.icon}</span>
            </div>
            <div>
              <p className="font-medium text-slate-900 text-sm">{transaction.company}</p>
              <p className="text-xs text-slate-500">{transaction.type}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-semibold text-sm ${
              transaction.amount > 0 ? 'text-emerald-600' : 'text-slate-900'
            }`}>
              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} DT
            </p>
            <p className="text-xs text-slate-500">{transaction.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
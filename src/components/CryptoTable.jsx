import { TABLE_HEADERS } from '../utils/constants';
import { formatNumber } from '../utils/helpers';

export default function CryptoTable({ rows, onUpdateRow, onRemoveRow }) {
  return (
    <div className='overflow-auto rounded-2xl border bg-white shadow'>
      <table className='min-w-full text-sm'>
        <thead className='bg-gray-100 sticky top-0'>
          <tr>
            {TABLE_HEADERS.map((h) => (
              <th
                key={h}
                className='text-left px-3 py-2 font-medium text-gray-700 whitespace-nowrap'
              >
                {h === 'G Token Price' ? 'G Token Price (USD)' : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className='border-t'>
              <td className='px-3 py-2'>
                <input
                  className='w-48 border rounded-lg px-2 py-1'
                  value={r.name}
                  onChange={(e) => onUpdateRow(idx, { name: e.target.value })}
                  placeholder='VD Bitcoin'
                />
              </td>
              <td className='px-3 py-2'>
                <input
                  className='w-32 border rounded-lg px-2 py-1'
                  type='number'
                  value={r.amount}
                  onChange={(e) => onUpdateRow(idx, { amount: e.target.value })}
                  placeholder='VD 1.23'
                />
              </td>
              <td className='px-3 py-2'>
                <input
                  className='w-48 border rounded-lg px-2 py-1'
                  value={r.launchAt}
                  onChange={(e) =>
                    onUpdateRow(idx, { launchAt: e.target.value })
                  }
                  placeholder='DD/MM/YYYY HH:mm:ss'
                />
              </td>
              <td className='px-3 py-2'>
                <input
                  className='w-56 border rounded-lg px-2 py-1'
                  value={r.apiId}
                  onChange={(e) => onUpdateRow(idx, { apiId: e.target.value })}
                  placeholder='VD bitcoin, ethereum'
                />
              </td>
              <td className='px-3 py-2'>
                <input
                  className='w-40 border rounded-lg px-2 py-1'
                  value={r.pointPriority}
                  onChange={(e) =>
                    onUpdateRow(idx, { pointPriority: e.target.value })
                  }
                  placeholder='Point Priority'
                />
              </td>
              <td className='px-3 py-2'>
                <input
                  className='w-40 border rounded-lg px-2 py-1'
                  value={r.pointFCFS}
                  onChange={(e) =>
                    onUpdateRow(idx, { pointFCFS: e.target.value })
                  }
                  placeholder='Point FCFS'
                />
              </td>
              <td className='px-3 py-2 text-right tabular-nums'>
                {formatNumber(r.price)}
              </td>
              <td className='px-3 py-2 text-right tabular-nums font-medium'>
                {formatNumber(r.value)}
              </td>
              <td className='px-3 py-2 text-right'>
                <button
                  onClick={() => onRemoveRow(idx)}
                  className='px-2 py-1 rounded-lg bg-rose-50 border text-rose-600 hover:bg-rose-100'
                >
                  Xoa
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={9} className='px-3 py-6 text-center text-gray-500'>
                Chua co du lieu. Bam Them dong hoac Dan tu Sheet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

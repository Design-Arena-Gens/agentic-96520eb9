'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ColumnStats {
  name: string
  type: 'numeric' | 'text'
  count: number
  unique: number
  nulls: number
  mean?: number
  min?: number
  max?: number
  median?: number
}

export default function Home() {
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [stats, setStats] = useState<ColumnStats[]>([])
  const [fileName, setFileName] = useState<string>('')

  const analyzeColumn = (columnName: string, values: any[]): ColumnStats => {
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '')
    const uniqueValues = new Set(nonNullValues)

    const numericValues = nonNullValues
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v))

    const isNumeric = numericValues.length > nonNullValues.length * 0.8

    const stats: ColumnStats = {
      name: columnName,
      type: isNumeric ? 'numeric' : 'text',
      count: values.length,
      unique: uniqueValues.size,
      nulls: values.length - nonNullValues.length,
    }

    if (isNumeric && numericValues.length > 0) {
      stats.mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length
      stats.min = Math.min(...numericValues)
      stats.max = Math.max(...numericValues)

      const sorted = [...numericValues].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      stats.median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid]
    }

    return stats
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as any[]
        setData(parsedData)

        if (parsedData.length > 0 && typeof parsedData[0] === 'object' && parsedData[0] !== null) {
          const cols = Object.keys(parsedData[0])
          setColumns(cols)

          const columnStats = cols.map(col => {
            const values = parsedData.map(row => row[col])
            return analyzeColumn(col, values)
          })
          setStats(columnStats)
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error)
        alert('Error parsing CSV file')
      }
    })
  }

  const getChartData = (columnName: string) => {
    const columnData = data.map(row => row[columnName])
    const valueCounts: { [key: string]: number } = {}

    columnData.forEach(value => {
      const key = value || 'null'
      valueCounts[key] = (valueCounts[key] || 0) + 1
    })

    return Object.entries(valueCounts)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))
  }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '300', marginBottom: '0.5rem' }}>
            CSV Analyzer
          </h1>
          <p style={{ color: '#6c757d', fontSize: '0.95rem' }}>
            Upload and analyze your CSV data
          </p>
        </header>

        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{
              padding: '0.75rem',
              border: '2px dashed #dee2e6',
              borderRadius: '4px',
              width: '100%',
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}
          />
          {fileName && (
            <p style={{ marginTop: '1rem', color: '#495057', fontSize: '0.9rem' }}>
              Loaded: <strong>{fileName}</strong> ({data.length} rows)
            </p>
          )}
        </div>

        {stats.length > 0 && (
          <>
            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '400', marginBottom: '1rem' }}>
                Column Statistics
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem'
              }}>
                {stats.map(stat => (
                  <div
                    key={stat.name}
                    style={{
                      background: 'white',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '1rem' }}>
                      {stat.name}
                    </h3>
                    <div style={{ fontSize: '0.9rem', color: '#495057' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Type:</span>
                        <span style={{ fontWeight: '500' }}>{stat.type}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Count:</span>
                        <span style={{ fontWeight: '500' }}>{stat.count}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Unique:</span>
                        <span style={{ fontWeight: '500' }}>{stat.unique}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Nulls:</span>
                        <span style={{ fontWeight: '500' }}>{stat.nulls}</span>
                      </div>
                      {stat.type === 'numeric' && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Mean:</span>
                            <span style={{ fontWeight: '500' }}>{stat.mean?.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Median:</span>
                            <span style={{ fontWeight: '500' }}>{stat.median?.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Min:</span>
                            <span style={{ fontWeight: '500' }}>{stat.min?.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Max:</span>
                            <span style={{ fontWeight: '500' }}>{stat.max?.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '400', marginBottom: '1rem' }}>
                Data Distribution (Top 10)
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                gap: '2rem'
              }}>
                {stats.slice(0, 4).map(stat => (
                  <div
                    key={stat.name}
                    style={{
                      background: 'white',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <h3 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '1rem' }}>
                      {stat.name}
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={getChartData(stat.name)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#4a90e2" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '400', marginBottom: '1rem' }}>
                Data Preview
              </h2>
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflowX: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                      {columns.map(col => (
                        <th
                          key={col}
                          style={{
                            padding: '0.75rem',
                            textAlign: 'left',
                            fontWeight: '500',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 10).map((row, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #dee2e6',
                          background: idx % 2 === 0 ? '#f8f9fa' : 'white'
                        }}
                      >
                        {columns.map(col => (
                          <td
                            key={col}
                            style={{
                              padding: '0.75rem',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.length > 10 && (
                  <p style={{ marginTop: '1rem', color: '#6c757d', fontSize: '0.85rem', textAlign: 'center' }}>
                    Showing 10 of {data.length} rows
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}

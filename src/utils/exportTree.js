export async function exportSubtreePdf(containerSelector = '.f3-chart', options = {}) {
  const { title = 'Family Tree', depth = 3 } = options

  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ])

  const el = document.querySelector(containerSelector)
  if (!el) throw new Error('Tree container not found')

  const canvas = await html2canvas(el, {
    backgroundColor: '#0f172a',
    scale: 2,
    useCORS: true,
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const ratio = Math.min(pageW / canvas.width, pageH / canvas.height)
  const imgW = canvas.width * ratio
  const imgH = canvas.height * ratio
  const x = (pageW - imgW) / 2
  const y = (pageH - imgH) / 2

  pdf.setFillColor(15, 23, 42)
  pdf.rect(0, 0, pageW, pageH, 'F')
  pdf.addImage(imgData, 'PNG', x, y, imgW, imgH)
  pdf.setFontSize(10)
  pdf.setTextColor(100, 116, 139)
  pdf.text(`${title} — exported ${new Date().toLocaleDateString()}`, 16, pageH - 10)

  pdf.save(`family-tree-${Date.now()}.pdf`)
}

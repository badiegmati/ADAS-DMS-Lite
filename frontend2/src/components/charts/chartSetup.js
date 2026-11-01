import {
  ArcElement, CategoryScale, Chart as ChartJS, Filler, Legend, LineElement,
  LinearScale, PointElement, Tooltip,
} from 'chart.js'

ChartJS.register(ArcElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip)
ChartJS.defaults.color = '#A9B4C7'
ChartJS.defaults.font.family = 'Inter, system-ui, sans-serif'
ChartJS.defaults.borderColor = 'rgba(255,255,255,0.08)'
export default ChartJS

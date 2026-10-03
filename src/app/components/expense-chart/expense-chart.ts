import { Component, ElementRef, ViewChild, input, effect, OnDestroy } from '@angular/core';
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-expense-chart',
  standalone: true,
  template: `
    <div class="chart-wrapper">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-wrapper {
      position: relative;
      width: 100%;
      height: 220px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class ExpenseChartComponent implements OnDestroy {
  @ViewChild('chartCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  data = input.required<Record<string, number>>();
  private chartInstance: Chart | null = null;

  constructor() {
    effect(() => {
      this.renderChart(this.data());
    });
  }

  private renderChart(dataMap: Record<string, number>) {
    const labels = Object.keys(dataMap);
    const values = Object.values(dataMap);

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    if (labels.length === 0) return;

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'],
          borderWidth: 3,
          borderColor: '#121824'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              padding: 14,
              color: '#94a3b8',
              font: { size: 11, weight: 'bold' }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ₹${(ctx.raw as number).toLocaleString('en-IN')}`
            }
          }
        },
        cutout: '74%'
      }
    });
  }

  ngOnDestroy() {
    if (this.chartInstance) this.chartInstance.destroy();
  }
}
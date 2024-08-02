import React, { useMemo, useCallback } from 'react';
import { AreaClosed, Line, Bar } from '@vx/shape';
import { curveMonotoneX } from '@vx/curve';
import { scaleTime, scaleLinear } from '@vx/scale';
import { withTooltip, Tooltip, defaultStyles } from '@vx/tooltip';
import { WithTooltipProvidedProps } from '@vx/tooltip/lib/enhancers/withTooltip';
import { localPoint } from '@vx/event';
import { LinearGradient } from '@vx/gradient';
import { max, extent, bisector, min } from 'd3-array';
import { timeFormat } from 'd3-time-format';
import { AxisBottom } from '@vx/vx';
import { ChartPoint } from '@/services';
import { DenomUnitSDKType } from '@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank';

type TooltipData = ChartPoint;

const intl = new Intl.DateTimeFormat("en-US", {
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
  hour: "numeric",
  minute: "2-digit",
  hour12: false,    
});
export const background = '#e6e9f0';
export const background2 = '#eef1f5';
export const accentColor = '#929ce4';
export const accentColorDark = '#6774da';
const tooltipStyles = {
  ...defaultStyles,
  background,
  border: '1px solid white',
  color: 'black',
};

// accessors
const getDate = (d: ChartPoint) => new Date(d.start);
const getStockValue = (d: ChartPoint) => {
  return parseFloat(d.price);
};
const bisectDate = bisector<ChartPoint, Date>(d => new Date(d.start)).left;

export type AreaProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  chartData: ChartPoint[];
  quoteTokenDisplayDenom: DenomUnitSDKType;
};

export default withTooltip<AreaProps, TooltipData>(
  ({
    width,
    height,
    margin = { top: 0, right: 0, bottom: 0, left: 0 },
    chartData,
    quoteTokenDisplayDenom,
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipTop = 0,
    tooltipLeft = 0,
  }: AreaProps & WithTooltipProvidedProps<TooltipData>) => {
    if (width < 10) return null;

    // bounds
    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    //scales
    const dateScale = useMemo(
      () =>
        scaleTime({
          range: [0, xMax],
          domain: extent(chartData, getDate) as [Date, Date],
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
      [xMax],
    );
    const stockValueScale = useMemo(
      () =>
        scaleLinear({
          range: [yMax, 0],
          domain: [min(chartData, getStockValue) || 0, (max(chartData, getStockValue) || 0) * 1.5],
          nice: true,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
      [yMax],
    );

    // tooltip handler
    const handleTooltip = useCallback(
      (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
        const { x } = localPoint(event) || { x: 0 };
        const x0 = dateScale.invert(x);
        const index = bisectDate(chartData, x0, 1);
        const d0 = chartData[index - 1];
        const d1 = chartData[index];
        let d = d0;
        if (d1 && getDate(d1)) {
          d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0;
        }
        showTooltip({
          tooltipData: d,
          tooltipLeft: x,
          tooltipTop: stockValueScale(getStockValue(d)),
        });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [showTooltip, stockValueScale, dateScale],
    );

    return (
      <div >
        <svg width={width} height={height}>
          <LinearGradient id="area-background-gradient" from={background} to={background2} />
          <LinearGradient id="area-gradient" from={accentColor} to={accentColor} toOpacity={0.1} />
          <AreaClosed<ChartPoint>
            data={chartData}
            // @ts-ignore
            x={d => dateScale(getDate(d))}
            // @ts-ignore
            y={d => stockValueScale(getStockValue(d))}
            yScale={stockValueScale}
            strokeWidth={1}
            stroke="url(#area-gradient)"
            fill="url(#area-gradient)"
            curve={curveMonotoneX}
          />
          <AxisBottom
            scale={dateScale}
            top={yMax}
            stroke={accentColorDark}
            orientation='bottom'
            tickStroke={accentColorDark}
          />
          <Bar
            x={0}
            y={0}
            width={width}
            height={height}
            fill="transparent"
            rx={14}
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
          />
          {tooltipData && (
            <g>
              <Line
                from={{ x: tooltipLeft, y: 0 }}
                to={{ x: tooltipLeft, y: yMax }}
                stroke={accentColor}
                strokeWidth={2}
                pointerEvents="none"
                strokeDasharray="5,2"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop + 1}
                r={4}
                fill="black"
                fillOpacity={0.1}
                stroke="black"
                strokeOpacity={0.1}
                strokeWidth={2}
                pointerEvents="none"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop}
                r={4}
                fill={accentColorDark}
                stroke="white"
                strokeWidth={2}
                pointerEvents="none"
              />
            </g>
          )}
        </svg>
        {tooltipData && (
          <div>
            <Tooltip top={tooltipTop - 12} left={tooltipLeft + 12} style={tooltipStyles}>
              {`${getStockValue(tooltipData)} ${quoteTokenDisplayDenom.denom.toUpperCase()}`}
            </Tooltip>
            <Tooltip
              top={yMax - 14}
              left={tooltipLeft}
              style={{
                ...defaultStyles,
                minWidth: 72,
                textAlign: 'center',
                transform: 'translateX(-50%)',
              }}
            >
              {intl.format(getDate(tooltipData))}
            </Tooltip>
          </div>
        )}
      </div>
    );
  },
);
import {ColorType, createChart} from 'lightweight-charts';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Box, Text, useColorModeValue} from "@interchain-ui/react";
import {getNoOfIntervalsNeeded} from "@/services";

interface PriceData {
    open: number;
    high: number;
    low: number;
    close: number;
    time: number;
    value: number;
}

interface ChartProps {
    priceData: PriceData[];
    chartType: string;
}

export const ChartComponent = (props: ChartProps) => {
    const {priceData} = props;
    const [chartText, setChartText] = useState<string>('Loading chart...');
    const [chartLoaded, setChartLoaded] = useState<boolean>(false);

    const chartContainerRef = useRef<HTMLDivElement>(null);

    const vColor = useColorModeValue('rgba(113,119,117,0.72)', 'rgba(185,183,183,0.72)');
    const gridColor = useColorModeValue('#d0d0d0', '#535d72');
    const textColor = useColorModeValue('#929ce4', '#929ce4');

    const errorTimeout = setTimeout(() => {
        setChartText("Error loading chart");
    }, 20000);

    const neededIntervals = useCallback(() => {
        if (!priceData || !props.chartType) {
            return 0
        }

        let neededIntervals = getNoOfIntervalsNeeded(props.chartType);

        if (priceData.length - 1 < neededIntervals) {
            neededIntervals = priceData.length - 1;
        }

        return neededIntervals;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.chartType]);

    const getBarSpacing = useCallback(() => {
        if (!priceData || !props.chartType) {
            return 0
        }

        let neededIntervals = getNoOfIntervalsNeeded(props.chartType);

        if (neededIntervals > 180) {
            return 2;
        }

        return 20;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.chartType]);

    const formatByAverage = (avg: number): { precision: number, minMove: number } => {
        if (avg < 0.0001) {
            return {precision: 7, minMove: 0.0000001};
        } else if (avg < 0.001) {
            return {precision: 6, minMove: 0.000001};
        } else if (avg < 0.01) {
            return {precision: 5, minMove: 0.00001};
        } else if (avg < 0.1) {
            return {precision: 4, minMove: 0.0001};
        } else if (avg < 1) {
            return {precision: 3, minMove: 0.001};
        } else {
            return {precision: 2, minMove: 0.01};
        }
    }

    const getPriceFormatOptions = useCallback((): { precision: number, minMove: number } => {
        if (!priceData || priceData.length === 0) {
            return {precision: 3, minMove: 0.0001};
        }

        const first = priceData[0];
        const middle = priceData[Math.floor(priceData.length / 2)];
        const last = priceData[priceData.length - 1];
        const avg = (first.high + first.low + middle.high + middle.low + last.high + last.low) / 6;

        return formatByAverage(avg);
    }, [priceData]);

    const getVolumeFormatOptions = useCallback((): { precision: number, minMove: number } => {
        if (!priceData || priceData.length === 0) {
            return {precision: 3, minMove: 0.0001};
        }

        const first = priceData[0];
        const middle = priceData[Math.floor(priceData.length / 2)];
        const last = priceData[priceData.length - 1];
        const avg = (first.value + middle.value + last.value) / 3;

        return formatByAverage(avg);
    }, [priceData]);

    const timeToLocal = (originalTime: number): number => {
        //https://tradingview.github.io/lightweight-charts/docs/time-zones
        const localOffset = new Date().getTimezoneOffset() * 60;
        return originalTime - localOffset;
    }

    useEffect(
        () => {
            if (!chartContainerRef.current) {
                return;
            }

            if (!priceData) {
                return;
            }

            const volumeData: PriceData[] = [];
            const filteredPriceData: PriceData[] = [];
            for (const item of priceData) {
                const convertedTime = timeToLocal(item.time);
                const formatted = {
                    ...item,
                    time: convertedTime
                }
                volumeData.push(formatted);

                if (item.open !== 0 && item.high !== 0 && item.low !== 0 && item.close !== 0) {
                    filteredPriceData.push(formatted);
                }
            }

            // @ts-ignore
            const chart = createChart(chartContainerRef.current, {
                layout: {
                    background: {
                        type: ColorType.Solid,
                        color: 'rgba(64,71,82,0)',
                    },
                    textColor,
                },
                // @ts-ignore
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight,
                grid: {
                    horzLines: {
                        color: gridColor,
                        // visible: false,
                    },
                },
                timeScale: {
                    barSpacing: getBarSpacing(),
                    borderColor: '#929ce4',
                    timeVisible: true,
                    rightOffset: 0,
                }
            });

            const handleResize = () => {
                // @ts-ignore
                chart.resize(chartContainerRef.current.clientWidth, chartContainerRef.current.clientHeight);
            };

            const {precision, minMove} = getPriceFormatOptions();
            const priceSeries = chart.addCandlestickSeries(
                {
                    upColor: '#26a69a',
                    downColor: '#ef5350',
                    borderVisible: true,
                    wickUpColor: '#26a69a',
                    wickDownColor: '#ef5350',
                    priceFormat: {
                        type: 'price',
                        precision: precision,
                        minMove: minMove,
                    },
                },
            );
            priceSeries.priceScale().applyOptions({
                autoScale: true,
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.4,
                },
                borderColor: '#929ce4',
            });

            // @ts-ignore
            priceSeries.setData(filteredPriceData);

            const {precision: vPrecision, minMove: vMinMove} = getVolumeFormatOptions();
            const volumeSeries = chart.addHistogramSeries({
                priceFormat: {
                    type: 'volume',
                    precision: vPrecision, // No decimal places for volume
                    minMove: vMinMove, // Minimum movement of 1 unit
                },
                priceScaleId: '', // set as an overlay by setting a blank priceScaleId
                color: vColor,
            });
            volumeSeries.priceScale().applyOptions({
                // set the positioning of the volume series
                scaleMargins: {
                    top: 0.8, // highest point of the series will be
                    bottom: 0,
                },
                textColor: vColor,
            });

            //@ts-ignore
            volumeSeries.setData(volumeData);

            const intervalsToDisplay = neededIntervals();
            if (intervalsToDisplay > 0) {
                let fromIndex = volumeData.length - 1 - intervalsToDisplay
                if (fromIndex < 0) {
                    fromIndex = 0;
                }

                chart.timeScale().setVisibleRange({
                    //@ts-ignore
                    from: volumeData[fromIndex].time,
                    //@ts-ignore
                    to: volumeData[volumeData.length - 1].time,
                });
            }

            setChartText("");
            setChartLoaded(true);
            clearTimeout(errorTimeout);

            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);

                chart.remove();
            };
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [priceData, vColor, gridColor, textColor]
    );

    return (
        <div
            ref={chartContainerRef}
            style={
                {
                    height: 470,
                    width: window.innerWidth > 768 ? 750 : 300,
                    margin: 30,
                    paddingLeft: 3,
                }
            }
        >
            <Box display={'flex'} justifyContent={'center'}>
                {!chartLoaded && <Text color={textColor}>{chartText}</Text>}
            </Box>
        </div>
    );
};
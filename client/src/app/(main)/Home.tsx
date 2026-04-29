import React, { useState, useMemo, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    useWindowDimensions,
    Pressable,
    Modal,
    PanResponder,
} from 'react-native';
import Svg, { Rect, Path, G, Circle } from 'react-native-svg';
import { Colors } from '@/constants/theme';
import { TrendingUp, TrendingDown, Wallet, Calendar, ChevronLeft, ChevronRight, X, Clock, Check, RefreshCcw } from 'lucide-react-native';
import { syncTransactions, fetchAndSyncProducts } from '@/api/sync';

const VIEW_MODES = ['MINUTELY', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

const generateData = (mode: string) => {
    const count = mode === 'MINUTELY' ? 60 : mode === 'HOURLY' ? 24 : mode === 'DAILY' ? 31 : mode === 'WEEKLY' ? 12 : mode === 'MONTHLY' ? 12 : 10;
    return Array.from({ length: count }, (_, i) => ({
        label: i.toString(),
        profit: Math.floor(Math.random() * 800) + 200,
        cost: Math.floor(Math.random() * 400) + 100,
        sold: Math.floor(Math.random() * 1200) + 300,
        timestamp: `${mode} ${i}`
    }));
};

const BrutalistCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <View style={[styles.card, { backgroundColor: Colors.white }]}>
        <View style={styles.cardHeader}>
            <Icon size={24} color={Colors.text} strokeWidth={3} />
            <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <Text style={[styles.cardValue, { color }]}>{value}</Text>
        {subtext && <Text style={styles.cardSubtext}>{subtext}</Text>}
    </View>
);

const SectionTitle = ({ title }: { title: string }) => (
    <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
);

const InteractionOverlay = ({ title, data, onClose }: any) => (
    <View style={styles.overlay}>
        <View style={styles.overlayHeader}>
            <Text style={styles.overlayTitle}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>X</Text>
            </Pressable>
        </View>
        <View style={styles.overlayContent}>
            {Object.entries(data).map(([key, val]: any) => (
                <View key={key} style={styles.overlayRow}>
                    <Text style={styles.overlayKey}>{key.toUpperCase()}:</Text>
                    <Text style={styles.overlayValue}>{typeof val === 'number' ? `$${val}` : val}</Text>
                </View>
            ))}
        </View>
    </View>
);

export default function DashboardScreen() {
    const { width } = useWindowDimensions();
    const [viewMode, setViewMode] = useState('DAILY');
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncTransactions();
            await fetchAndSyncProducts();
            alert('Sync complete!');
        } catch (error) {
            console.error(error);
            alert('Sync failed');
        } finally {
            setIsSyncing(false);
        }
    };
    
    // 1. DIMENSIONS & DATA FIRST
    const padding = 24 * 2;
    const viewportWidth = width - padding - 32;
    const chartData = useMemo(() => generateData(viewMode), [viewMode]);
    const barWidth = 40;
    const barGap = 15;
    const barSpacing = barWidth + barGap;
    const totalChartWidth = Math.max(viewportWidth, chartData.length * barSpacing);

    // 2. STATES
    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [selectedBar, setSelectedBar] = useState<any>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [tempMode, setTempMode] = useState(viewMode);
    const [startDate, setStartDate] = useState('2023-10-01');
    const [endDate, setEndDate] = useState('2023-10-31');
    const [selectedHour, setSelectedHour] = useState(14);

    // 3. SLIDER LOGIC DEPENDS ON DIMENSIONS
    const handleWidth = useMemo(() => (viewportWidth / totalChartWidth) * viewportWidth, [viewportWidth, totalChartWidth]);
    const maxHandlePos = viewportWidth - handleWidth;
    const maxChartScroll = totalChartWidth - viewportWidth;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (evt, gestureState) => {
                const newHandlePos = Math.max(0, Math.min(maxHandlePos, gestureState.moveX - padding - 16 - (handleWidth / 2)));
                const newScrollX = maxHandlePos > 0 ? (newHandlePos / maxHandlePos) * maxChartScroll : 0;
                scrollViewRef.current?.scrollTo({ x: newScrollX, animated: false });
            },
        })
    ).current;

    // Calendar State
    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    const [calendarType, setCalendarType] = useState<'START' | 'END'>('START');
    const [currentViewDate, setCurrentViewDate] = useState(new Date());

    const calendarDays = useMemo(() => {
        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    }, [currentViewDate]);

    const monthName = currentViewDate.toLocaleString('default', { month: 'long' }).toUpperCase();

    const handleDateSelect = (day: number) => {
        const d = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), day);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const formatted = `${yyyy}-${mm}-${dd}`;
        
        if (calendarType === 'START') setStartDate(formatted);
        else setEndDate(formatted);
        setIsCalendarVisible(false);
    };

    const changeMonth = (offset: number) => {
        const next = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + offset, 1);
        setCurrentViewDate(next);
    };

    const dateRangeLabel = useMemo(() => {
        switch (viewMode) {
            case 'MINUTELY': return `OCT 26, 2023 | ${selectedHour}:00 - ${selectedHour}:59`;
            case 'HOURLY': return `OCT 26, 2023 (FULL DAY)`;
            case 'DAILY': return `${startDate} - ${endDate}`;
            case 'WEEKLY': return 'Q4 | OCT - DEC 2023';
            case 'MONTHLY': return 'JAN 2023 - DEC 2023';
            case 'YEARLY': return '2018 - 2023';
            default: return '';
        }
    }, [viewMode, startDate, endDate, selectedHour]);

    const handleApplyRange = () => {
        setViewMode(tempMode);
        setIsPickerVisible(false);
        setSelectedBar(null);
    };

    const handleQuickSelect = (type: string) => {
        const now = new Date();
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        switch (type) {
            case 'TODAY':
                setStartDate(formatDate(now));
                setEndDate(formatDate(now));
                setTempMode('HOURLY');
                break;
            case 'LAST 7 DAYS':
                const last7 = new Date();
                last7.setDate(now.getDate() - 7);
                setStartDate(formatDate(last7));
                setEndDate(formatDate(now));
                setTempMode('DAILY');
                break;
            case 'THIS MONTH':
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                setStartDate(formatDate(firstDay));
                setEndDate(formatDate(now));
                setTempMode('DAILY');
                break;
            case 'THIS YEAR':
                const firstDayYear = new Date(now.getFullYear(), 0, 1);
                setStartDate(formatDate(firstDayYear));
                setEndDate(formatDate(now));
                setTempMode('MONTHLY');
                break;
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.summaryGrid}>
                <BrutalistCard title="PROFITS" value="$12,450.00" icon={TrendingUp} color="#00FF00" subtext="+12% FROM LAST MONTH" />
                <BrutalistCard title="LOSS" value="$2,100.50" icon={TrendingDown} color="#FF0000" subtext="-5% FROM LAST MONTH" />
                <View style={{ width: '100%' }}>
                    <BrutalistCard title="NET WORTH" value="$45,800.00" icon={Wallet} color={Colors.primary} subtext="ESTIMATED TOTAL ASSETS" />
                </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <SectionTitle title="SALES ANALYTICS" />
                <Pressable 
                    onPress={handleSync}
                    disabled={isSyncing}
                    style={({ pressed }) => [
                        styles.syncButton,
                        pressed && styles.syncButtonPressed,
                        isSyncing && { opacity: 0.5 }
                    ]}
                >
                    <RefreshCcw size={20} color={Colors.white} strokeWidth={3} />
                    <Text style={styles.syncButtonText}>{isSyncing ? 'SYNCING...' : 'SYNC NOW'}</Text>
                </Pressable>
            </View>

            <View style={styles.chartContainer}>
                {/* INTERACTIVE Date Range Header */}
                <Pressable
                    style={({ pressed }) => [styles.rangeHeader, pressed && styles.rangeHeaderPressed]}
                    onPress={() => {
                        setTempMode(viewMode);
                        setIsPickerVisible(true);
                    }}
                >
                    <View style={styles.rangeLabelContainer}>
                        <Calendar size={18} color={Colors.text} style={{ marginRight: 12 }} strokeWidth={3} />
                        <View>
                            <Text style={styles.rangeSublabel}>SELECT RANGE ({viewMode})</Text>
                            <Text style={styles.rangeLabelText}>{dateRangeLabel}</Text>
                        </View>
                    </View>
                    <Clock size={20} color={Colors.primary} strokeWidth={3} />
                </Pressable>

                <ScrollView 
                    ref={scrollViewRef}
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.barScroll}
                    onScroll={(e) => setScrollPosition(e.nativeEvent.contentOffset.x)}
                    scrollEventThrottle={16}
                >
                    <View>
                        <Svg height="200" width={totalChartWidth}>
                            {chartData.map((d, i) => (
                                <Rect
                                    key={i}
                                    x={i * barSpacing + barGap / 2}
                                    y={200 - (d.profit / 8)}
                                    width={barWidth}
                                    height={d.profit / 8}
                                    fill={selectedBar?.timestamp === d.timestamp ? '#FFFF00' : (i % 2 === 0 ? Colors.primary : Colors.text)}
                                    stroke={Colors.text}
                                    strokeWidth="3"
                                    onPress={() => setSelectedBar(d)}
                                />
                            ))}
                            <Path d={`M 0 200 L ${totalChartWidth} 200`} stroke={Colors.text} strokeWidth="4" />
                        </Svg>
                        <View style={[styles.chartLabels, { width: totalChartWidth }]}>
                            {chartData.map((d, i) => (
                                <Text key={i} style={[styles.chartLabelText, { width: barSpacing, textAlign: 'center' }]}>
                                    {viewMode === 'HOURLY' ? `${i}h` : viewMode === 'DAILY' ? i + 1 : d.label}
                                </Text>
                            ))}
                        </View>
                    </View>
                </ScrollView>

                {/* Custom Brutalist Slider */}
                {totalChartWidth > viewportWidth && (
                    <View 
                        style={styles.sliderTrack}
                        {...panResponder.panHandlers}
                    >
                        <View 
                            style={[
                                styles.sliderHandle, 
                                { 
                                    width: handleWidth,
                                    left: maxChartScroll > 0 ? (scrollPosition / maxChartScroll) * maxHandlePos : 0
                                }
                            ]} 
                        />
                    </View>
                )}

                {selectedBar && (
                    <InteractionOverlay
                        title={`${viewMode} DATA: ${selectedBar.timestamp}`}
                        data={{ profit: selectedBar.profit, cost: selectedBar.cost, sold: selectedBar.sold }}
                        onClose={() => setSelectedBar(null)}
                    />
                )}
            </View>

            {/* Range Picker Modal */}
            <Modal
                visible={isPickerVisible}
                transparent={true}
                animationType="none"
                onRequestClose={() => setIsPickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>TIME RANGE SELECTOR</Text>
                            <Pressable onPress={() => setIsPickerVisible(false)} style={styles.modalClose}>
                                <X size={24} color={Colors.white} strokeWidth={4} />
                            </Pressable>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.modalLabel}>SELECT SCALE</Text>
                            <View style={styles.gridSelector}>
                                {VIEW_MODES.map((mode) => (
                                    <Pressable
                                        key={mode}
                                        onPress={() => setTempMode(mode)}
                                        style={[
                                            styles.gridItem,
                                            tempMode === mode && styles.gridItemActive
                                        ]}
                                    >
                                        <Text style={[styles.gridText, tempMode === mode && styles.gridTextActive]}>{mode}</Text>
                                        {tempMode === mode && <Check size={14} color={Colors.white} strokeWidth={4} />}
                                    </Pressable>
                                ))}
                            </View>

                            {tempMode === 'MINUTELY' ? (
                                <View style={{ marginBottom: 24 }}>
                                    <Text style={styles.modalLabel}>SELECT HOUR (CLOCK)</Text>
                                    <View style={styles.clockGrid}>
                                        {Array.from({ length: 24 }).map((_, h) => (
                                            <Pressable
                                                key={h}
                                                style={[styles.hourCell, selectedHour === h && styles.hourCellActive]}
                                                onPress={() => setSelectedHour(h)}
                                            >
                                                <Text style={[styles.hourText, selectedHour === h && styles.hourTextActive]}>
                                                    {h.toString().padStart(2, '0')}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            ) : tempMode === 'HOURLY' ? (
                                <View style={{ marginBottom: 24 }}>
                                    <Text style={styles.modalLabel}>SELECT DAY</Text>
                                    <Pressable 
                                        style={styles.dateSelectorField} 
                                        onPress={() => { setCalendarType('START'); setIsCalendarVisible(true); }}
                                    >
                                        <Text style={styles.dateSelectorText}>{startDate}</Text>
                                        <Calendar size={14} color={Colors.text} />
                                    </Pressable>
                                </View>
                            ) : (
                                <>
                                    <Text style={styles.modalLabel}>CUSTOM RANGE</Text>
                                    <View style={styles.inputRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.inputSublabel}>START DATE</Text>
                                            <Pressable 
                                                style={styles.dateSelectorField} 
                                                onPress={() => { setCalendarType('START'); setIsCalendarVisible(true); }}
                                            >
                                                <Text style={styles.dateSelectorText}>{startDate}</Text>
                                                <Calendar size={14} color={Colors.text} />
                                            </Pressable>
                                        </View>
                                        <View style={{ width: 20, alignItems: 'center', justifyContent: 'center', marginTop: 20 }}>
                                            <Text style={{ fontWeight: '900' }}>→</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.inputSublabel}>END DATE</Text>
                                            <Pressable 
                                                style={styles.dateSelectorField} 
                                                onPress={() => { setCalendarType('END'); setIsCalendarVisible(true); }}
                                            >
                                                <Text style={styles.dateSelectorText}>{endDate}</Text>
                                                <Calendar size={14} color={Colors.text} />
                                            </Pressable>
                                        </View>
                                    </View>
                                </>
                            )}
                            {isCalendarVisible && (
                                <View style={styles.calendarContainer}>
                                    <View style={styles.calendarHeader}>
                                        <Pressable onPress={() => changeMonth(-1)}><ChevronLeft size={20} color={Colors.white} /></Pressable>
                                        <Text style={styles.calendarTitle}>{monthName} {currentViewDate.getFullYear()}</Text>
                                        <Pressable onPress={() => changeMonth(1)}><ChevronRight size={20} color={Colors.white} /></Pressable>
                                    </View>
                                    <View style={styles.weekDays}>
                                        {['S','M','T','W','T','F','S'].map((d, i) => <Text key={`${d}-${i}`} style={styles.weekDayText}>{d}</Text>)}
                                    </View>

                                    <View style={styles.daysGrid}>
                                        {calendarDays.map((day, i) => (
                                            <Pressable
                                                key={i}
                                                style={[styles.dayCell, !day && { opacity: 0 }]}
                                                disabled={!day}
                                                onPress={() => day && handleDateSelect(day)}
                                            >
                                                <Text style={styles.dayText}>{day}</Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                    <Pressable style={styles.closeCalendar} onPress={() => setIsCalendarVisible(false)}>
                                        <Text style={styles.closeCalendarText}>CLOSE CALENDAR</Text>
                                    </Pressable>
                                </View>
                            )}
                            <View style={styles.quickSelect}>
                                <Text style={styles.inputSublabel}>QUICK SELECT</Text>
                                <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                                    {['TODAY', 'LAST 7 DAYS', 'THIS MONTH', 'THIS YEAR'].map(q => (
                                        <Pressable
                                            key={q}
                                            style={styles.quickButton}
                                            onPress={() => handleQuickSelect(q)}
                                        >
                                            <Text style={styles.quickButtonText}>{q}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>

                        <Pressable
                            style={({ pressed }) => [styles.applyButton, pressed && styles.buttonPressed]}
                            onPress={handleApplyRange}
                        >
                            <Text style={styles.applyButtonText}>APPLY RANGE</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            <SectionTitle title="CATEGORY PERFORMANCE" />
            <View style={[styles.chartContainer, { alignItems: 'center' }]}>
                <Svg height="220" width="220" viewBox="0 0 100 100">
                    <G rotation="-90" origin="50, 50">
                        <Path d="M 50 50 L 100 50 A 50 50 0 0 1 50 100 Z" fill={Colors.primary} stroke={Colors.text} strokeWidth="2" />
                        <Path d="M 50 50 L 50 100 A 50 50 0 0 1 0 50 Z" fill="#FF0000" stroke={Colors.text} strokeWidth="2" />
                        <Path d="M 50 50 L 0 50 A 50 50 0 0 1 50 0 Z" fill="#00FF00" stroke={Colors.text} strokeWidth="2" />
                        <Path d="M 50 50 L 50 0 A 50 50 0 0 1 100 50 Z" fill={Colors.backgroundElement} stroke={Colors.text} strokeWidth="2" />
                    </G>
                </Svg>
            </View>
            <View style={{ height: 120 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundElement,
    },
    content: {
        padding: 24,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 32,
    },
    card: {
        width: '47%',
        borderWidth: 4,
        borderColor: Colors.text,
        padding: 16,
        borderBottomWidth: 10,
        borderRightWidth: 10,
        marginBottom: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: 1,
    },
    cardValue: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 4,
    },
    cardSubtext: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.textSecondary,
    },
    sectionTitleContainer: {
        backgroundColor: Colors.text,
        padding: 8,
        marginBottom: 16,
        alignSelf: 'flex-start',
        borderRightWidth: 8,
        borderColor: Colors.primary,
    },
    sectionTitle: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    chartContainer: {
        backgroundColor: Colors.white,
        borderWidth: 4,
        borderColor: Colors.text,
        padding: 16,
        marginBottom: 32,
        borderBottomWidth: 10,
        borderRightWidth: 10,
    },
    rangeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        backgroundColor: Colors.backgroundElement,
        borderWidth: 4,
        borderColor: Colors.text,
        padding: 12,
        borderBottomWidth: 8,
        borderRightWidth: 8,
    },
    rangeHeaderPressed: {
        borderBottomWidth: 4,
        borderRightWidth: 4,
        transform: [{ translateX: 4 }, { translateY: 4 }],
    },
    rangeLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rangeSublabel: {
        fontSize: 8,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 1,
    },
    rangeLabelText: {
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },
    barScroll: {
        paddingBottom: 10,
    },
    sliderTrack: {
        height: 16,
        backgroundColor: Colors.backgroundElement,
        borderWidth: 3,
        borderColor: Colors.text,
        marginTop: 10,
        position: 'relative',
    },
    sliderHandle: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRightWidth: 3,
        borderLeftWidth: 3,
        borderColor: Colors.text,
    },
    chartLabels: {
        flexDirection: 'row',
        marginTop: 8,
    },
    chartLabelText: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.text,
    },
    overlay: {
        backgroundColor: '#FFFF00',
        borderWidth: 4,
        borderColor: Colors.text,
        padding: 12,
        marginTop: 16,
        borderBottomWidth: 8,
        borderRightWidth: 8,
    },
    overlayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderColor: Colors.text,
        paddingBottom: 4,
        marginBottom: 8,
    },
    overlayTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },
    closeButton: {
        backgroundColor: Colors.text,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    closeButtonText: {
        color: Colors.white,
        fontWeight: '900',
        fontSize: 12,
    },
    overlayContent: {
        gap: 4,
    },
    overlayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    overlayKey: {
        fontSize: 11,
        fontWeight: '900',
    },
    overlayValue: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(17, 45, 78, 0.8)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderWidth: 6,
        borderColor: Colors.text,
        borderBottomWidth: 15,
        borderRightWidth: 15,
    },
    modalHeader: {
        backgroundColor: Colors.text,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    modalTitle: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    modalClose: {
        padding: 4,
    },
    modalBody: {
        padding: 20,
        maxHeight: 400,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 12,
        textDecorationLine: 'underline',
    },
    gridSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    gridItem: {
        width: '48%',
        padding: 12,
        backgroundColor: Colors.backgroundElement,
        borderWidth: 3,
        borderColor: Colors.text,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gridItemActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.text,
    },
    gridText: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.text,
    },
    gridTextActive: {
        color: Colors.white,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    dateSelectorField: {
        borderWidth: 3,
        borderColor: Colors.text,
        padding: 12,
        backgroundColor: Colors.white,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateSelectorText: {
        fontSize: 12,
        fontWeight: '900',
        color: Colors.text,
    },
    calendarContainer: {
        borderWidth: 4,
        borderColor: Colors.text,
        backgroundColor: Colors.white,
        marginBottom: 24,
        borderBottomWidth: 10,
        borderRightWidth: 10,
    },
    calendarHeader: {
        backgroundColor: Colors.text,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
    },
    calendarTitle: {
        color: Colors.white,
        fontWeight: '900',
        fontSize: 14,
    },
    weekDays: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderColor: Colors.text,
        backgroundColor: Colors.backgroundElement,
    },
    weekDayText: {
        flex: 1,
        textAlign: 'center',
        paddingVertical: 8,
        fontSize: 10,
        fontWeight: '900',
        color: Colors.text,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: Colors.border,
    },
    dayText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    closeCalendar: {
        backgroundColor: Colors.backgroundElement,
        padding: 12,
        alignItems: 'center',
        borderTopWidth: 2,
        borderColor: Colors.text,
    },
    closeCalendarText: {
        fontSize: 10,
        fontWeight: '900',
    },
    clockGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
    },
    hourCell: {
        width: 45,
        height: 45,
        backgroundColor: Colors.backgroundElement,
        borderWidth: 2,
        borderColor: Colors.text,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hourCellActive: {
        backgroundColor: Colors.text,
    },
    hourText: {
        fontSize: 12,
        fontWeight: '900',
        color: Colors.text,
    },
    hourTextActive: {
        color: Colors.white,
    },
    quickSelect: {
        marginBottom: 20,
    },
    quickButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 2,
        borderColor: Colors.text,
        backgroundColor: Colors.backgroundElement,
    },
    quickButtonText: {
        fontSize: 10,
        fontWeight: '900',
    },
    applyButton: {
        backgroundColor: '#00FF00',
        paddingVertical: 20,
        alignItems: 'center',
        borderTopWidth: 6,
        borderColor: Colors.text,
    },
    buttonPressed: {
        backgroundColor: '#00DD00',
    },
    applyButtonText: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: 2,
    },
    inputSublabel: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    syncButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 3,
        borderColor: Colors.text,
        borderBottomWidth: 6,
        borderRightWidth: 6,
        gap: 8,
    },
    syncButtonPressed: {
        borderBottomWidth: 3,
        borderRightWidth: 3,
        transform: [{ translateX: 3 }, { translateY: 3 }],
    },
    syncButtonText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '900',
    }
});

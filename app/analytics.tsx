import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Dimensions,
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useValen } from '../src/context/ValenContext';
import { db, VALEN_APP_ID } from '../src/services/firebase';
import { analyzeUserBehavior } from '../src/utils/AI_Engine';

const { width } = Dimensions.get('window');

const CREAM_BG = '#F5F5F0';
const MINT_GREEN = '#00BFA5';
const ACADEMIC_BLUE = '#007AFF';
const CARD_WHITE = '#FFFFFF';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';
const WARNING_ORANGE = '#FF9500';
const CRITICAL_RED = '#FF3B30';

// Reusable Activity Ring Component
const ActivityRings = ({ discipline, academic, size = 45 }) => {
    const strokeWidth = 5;
    const radiusOuter = (size - strokeWidth) / 2;
    const radiusInner = radiusOuter - strokeWidth - 2;
    const circumferenceOuter = 2 * Math.PI * radiusOuter;
    const circumferenceInner = 2 * Math.PI * radiusInner;

    const isFuture = discipline === 0 && academic === 0;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Circle
                cx={size / 2} cy={size / 2} r={radiusOuter}
                stroke={isFuture ? "#F0F0EB" : "rgba(0, 191, 165, 0.15)"}
                strokeWidth={strokeWidth} fill="none"
            />
            <Circle
                cx={size / 2} cy={size / 2} r={radiusOuter}
                stroke={MINT_GREEN} strokeWidth={strokeWidth}
                strokeDasharray={`${circumferenceOuter} ${circumferenceOuter}`}
                strokeDashoffset={circumferenceOuter * (1 - Math.min(discipline, 1))}
                strokeLinecap="round" fill="none"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            <Circle
                cx={size / 2} cy={size / 2} r={radiusInner}
                stroke={isFuture ? "#F0F0EB" : "rgba(0, 122, 255, 0.15)"}
                strokeWidth={strokeWidth} fill="none"
            />
            <Circle
                cx={size / 2} cy={size / 2} r={radiusInner}
                stroke={ACADEMIC_BLUE} strokeWidth={strokeWidth}
                strokeDasharray={`${circumferenceInner} ${circumferenceInner}`}
                strokeDashoffset={circumferenceInner * (1 - Math.min(academic, 1))}
                strokeLinecap="round" fill="none"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
        </Svg>
    );
};

export default function AnalyticsScreen() {
    const router = useRouter();
    const { user, modules, religiousActivities, fitnessActivities, visions, profile } = useValen();
    const [weekOffset, setWeekOffset] = useState(0);
    const [historySnapshots, setHistorySnapshots] = useState<any[]>([]);

    // --- FETCH ARCHIVED SNAPSHOTS ---
    useEffect(() => {
        if (!user) return;
        const snapshotsCol = collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'daily_snapshots');
        const q = query(snapshotsCol, orderBy('date', 'desc'), limit(35)); 
        
        const unsub = onSnapshot(q, (snap) => {
            setHistorySnapshots(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsub;
    }, [user]);

    // --- REAL-TIME STATS CALCULATION ---
    const stats = useMemo(() => {
        const totalHours = modules.reduce((acc, m) => acc + (m.hoursDone || 0), 0);
        const totalHabits = religiousActivities.length + fitnessActivities.length + visions.length;
        const completedHabits = 
            religiousActivities.filter(a => a.completed).length + 
            fitnessActivities.filter(a => a.completed).length + 
            visions.filter(v => v.progress >= 90).length;
        
        const consistency = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
        
        return { 
            totalHours, consistency, completedHabits,
            academicPower: Math.min(totalHours / 40, 1),
            fitnessPower: fitnessActivities.length > 0 ? fitnessActivities.filter(a => a.completed).length / fitnessActivities.length : 0,
            faithPower: religiousActivities.length > 0 ? religiousActivities.filter(a => a.completed).length / religiousActivities.length : 0,
            visionPower: visions.length > 0 ? (visions.reduce((acc, v) => acc + (v.progress || 0), 0) / (visions.length * 100)) : 0
        };
    }, [modules, religiousActivities, fitnessActivities, visions]);

    // --- AI MOOD SYSTEM ---
    const aiMoodColor = useMemo(() => {
        if (stats.consistency >= 90 && stats.academicPower >= 0.5) return MINT_GREEN; // Elite
        if (stats.consistency >= 60) return ACADEMIC_BLUE; // Focused
        if (stats.consistency >= 30) return WARNING_ORANGE; // Warning
        return CRITICAL_RED; // Critical
    }, [stats]);

    const archetype = useMemo(() => {
        if (stats.consistency >= 85 && stats.academicPower >= 0.7) return { name: 'The Architect', icon: 'construct', sub: 'Master of structure and depth' };
        if (stats.academicPower >= 0.8) return { name: 'The Scholar', icon: 'book', sub: 'Superior academic focus' };
        if (stats.totalHours > 20) return { name: 'The Deep Worker', icon: 'timer', sub: 'High focus endurance' };
        return { name: 'The Novice', icon: 'leaf', sub: 'Beginning the journey to focus' };
    }, [stats]);

    // --- DATA MAPPING FOR RINGS ---
    const getWeekData = (offset: number) => {
        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        const now = new Date();
        const todayIndex = (now.getDay() + 6) % 7; 
        
        return days.map((day, index) => {
            const dateObj = new Date(now);
            dateObj.setDate(now.getDate() - todayIndex + index - (offset * 7));
            const dateKey = dateObj.toISOString().split('T')[0]; 
            
            const isToday = offset === 0 && index === todayIndex;
            const isFuture = (offset === 0 && index > todayIndex) || offset < 0;

            const daySnapshot = historySnapshots.find(s => s.id === dateKey);

            return {
                day,
                date: dateObj.getDate().toString(),
                month: dateObj.toLocaleString('default', { month: 'short' }),
                discipline: isFuture ? 0 : (isToday ? stats.consistency / 100 : (daySnapshot?.disciplineScore || 0)), 
                academic: isFuture ? 0 : (isToday ? stats.academicPower : (daySnapshot?.focusMinutes / 240 || 0)),
                isToday,
                isFuture
            };
        });
    };

    const weekPages = [0, 1, 2, 3, 4];
    
    // --- INTEGRATED NEURAL PA INSIGHT ---
    const paInsight = useMemo(() => { 
        return analyzeUserBehavior(stats, profile, historySnapshots); 
    }, [stats, profile, historySnapshots]);

    const aiPulse = useSharedValue(1);
    useEffect(() => {
        aiPulse.value = withRepeat(withTiming(0.4, { duration: 1500 }), -1, true);
    }, []);
    const aiPulseStyle = useAnimatedStyle(() => ({ opacity: aiPulse.value }));

    const onScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const page = Math.round(offsetX / (width - 40));
        setWeekOffset(page);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Executive Summary</Text>
                <View style={{ width: 45 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <View style={styles.mainScorecard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.labelCaps}>Consistency Score</Text>
                        <Text style={styles.scoreValue}>{stats.consistency}%</Text>
                        <View style={styles.badge}>
                            <Ionicons name="star" size={14} color={MINT_GREEN} />
                            <Text style={styles.badgeText}>Live Performance</Text>
                        </View>
                    </View>
                    <View style={styles.archetypeBox}>
                        <Ionicons name={archetype.icon as any} size={42} color={MINT_GREEN} />
                        <Text style={styles.archetypeTitle}>{archetype.name}</Text>
                        <Text style={styles.archetypeSub}>{archetype.sub}</Text>
                    </View>
                </View>

                <View style={[styles.bentoLarge, { paddingHorizontal: 0 }]}>
                    <View style={styles.chartHeader}>
                        <View>
                            <Text style={[styles.labelCaps, { paddingLeft: 25, marginBottom: 0 }]}>
                                {weekOffset === 0 ? 'Current Week' : `Week of ${getWeekData(weekOffset)[0].date} ${getWeekData(weekOffset)[0].month}`}
                            </Text>
                            <Text style={[styles.chartSub, { paddingLeft: 25 }]}>Activity History</Text>
                        </View>
                        <View style={styles.weekIndicatorRow}>
                             {weekPages.map(p => <View key={p} style={[styles.dot, weekOffset === p && styles.activeDot]} />)}
                        </View>
                    </View>
                    
                    <FlatList
                        data={weekPages}
                        horizontal
                        pagingEnabled
                        onScroll={onScroll}
                        scrollEventThrottle={16}
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.weekPage}>
                                {getWeekData(item).map((d, i) => (
                                    <View key={i} style={styles.dayColumn}>
                                        <Text style={[styles.dayLetter, d.isToday && { color: TEXT_DARK }]}>{d.day}</Text>
                                        <View style={styles.ringWrapper}>
                                            <ActivityRings discipline={d.discipline} academic={d.academic} />
                                            {d.isToday && <View style={styles.todayHighlight} />}
                                        </View>
                                        <Text style={[styles.dayDate, d.isToday && styles.todayText]}>{d.date}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    />
                    <View style={styles.swipeHint}>
                        <Ionicons name="arrow-back" size={10} color={TEXT_GREY} />
                        <Text style={styles.swipeText}>SWIPE FOR HISTORY</Text>
                    </View>
                </View>

                <View style={styles.bentoRow}>
                    <View style={[styles.bentoSmall, { flex: 1 }]}>
                        <Text style={styles.labelCaps}>Focus Volume</Text>
                        <Text style={styles.statValue}>{stats.totalHours.toFixed(1)}<Text style={styles.statUnit}>h</Text></Text>
                        <Text style={styles.statDesc}>Academic Depth</Text>
                    </View>
                    <View style={[styles.bentoSmall, { flex: 1 }]}>
                        <Text style={styles.labelCaps}>Disciplines</Text>
                        <Text style={styles.statValue}>{stats.completedHabits}</Text>
                        <Text style={styles.statDesc}>Items Completed Today</Text>
                    </View>
                </View>

                <View style={styles.bentoLarge}>
                    <Text style={styles.labelCaps}>Pillar Distribution</Text>
                    {[
                        { label: 'Academic', val: stats.academicPower, color: ACADEMIC_BLUE },
                        { label: 'Fitness', val: stats.fitnessPower, color: MINT_GREEN },
                        { label: 'Faith', val: stats.faithPower, color: '#FF9500' },
                        { label: 'Vision', val: stats.visionPower, color: '#AF52DE' },
                    ].map((pillar, idx) => (
                        <View key={idx} style={styles.pillarRow}>
                            <Text style={styles.pillarLabel}>{pillar.label}</Text>
                            <View style={styles.pillarTrack}>
                                <View style={[styles.pillarFill, { width: `${pillar.val * 100}%`, backgroundColor: pillar.color }]} />
                            </View>
                            <Text style={styles.pillarPercent}>{Math.round(pillar.val * 100)}%</Text>
                        </View>
                    ))}
                </View>

                {/* NEURAL PA ASSISTANT WITH DYNAMIC MOOD COLORS */}
                <View style={[styles.bentoLarge, styles.paAssistantCard, { borderColor: aiMoodColor }]}>
                    <View style={styles.paHeader}>
                        <Ionicons name="sparkles" size={18} color={aiMoodColor} />
                        <Text style={[styles.paTitle, { color: aiMoodColor }]}>Neural PA Assistant</Text>
                    </View>
                    <Animated.Text entering={FadeInUp.delay(300)} style={styles.paMessage}>
                        {paInsight}
                    </Animated.Text>
                    <View style={styles.aiFooter}>
                        <Text style={styles.aiFooterText}>Valen Core Engine v2.0</Text>
                        <Animated.View style={[styles.pulseDot, aiPulseStyle, { backgroundColor: aiMoodColor }]} />
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: CREAM_BG },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 45, height: 45, borderRadius: 22, backgroundColor: CARD_WHITE, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: TEXT_DARK },
    scrollContent: { padding: 20 },
    labelCaps: { fontSize: 10, fontWeight: '800', color: TEXT_GREY, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 15 },
    mainScorecard: { backgroundColor: CARD_WHITE, borderRadius: 30, padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    scoreValue: { fontSize: 52, fontWeight: '900', color: TEXT_DARK },
    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FAF9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, alignSelf: 'flex-start', marginTop: 10 },
    badgeText: { fontSize: 10, fontWeight: '700', color: MINT_GREEN, marginLeft: 4 },
    archetypeBox: { alignItems: 'center', paddingLeft: 20, width: 140 },
    archetypeTitle: { fontSize: 14, fontWeight: '800', color: TEXT_DARK, marginTop: 8, textAlign: 'center' },
    archetypeSub: { fontSize: 10, color: TEXT_GREY, textAlign: 'center', marginTop: 4, lineHeight: 14 },
    bentoLarge: { backgroundColor: CARD_WHITE, borderRadius: 30, padding: 25, marginBottom: 15 },
    weekPage: { width: width - 40, flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 15 },
    dayColumn: { alignItems: 'center' },
    dayLetter: { fontSize: 11, fontWeight: '800', color: TEXT_GREY, marginBottom: 10 },
    ringWrapper: { padding: 4, marginBottom: 8, alignItems: 'center', justifyContent: 'center' },
    todayHighlight: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(26, 26, 26, 0.05)', zIndex: -1 },
    dayDate: { fontSize: 12, fontWeight: '700', color: TEXT_GREY },
    todayText: { color: TEXT_DARK },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingRight: 25 },
    chartSub: { fontSize: 10, color: TEXT_GREY, fontWeight: '600', marginTop: -10 },
    weekIndicatorRow: { flexDirection: 'row', gap: 4, marginTop: 5 },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#EEE' },
    activeDot: { backgroundColor: MINT_GREEN, width: 12 },
    swipeHint: { alignItems: 'center', marginTop: 15, flexDirection: 'row', justifyContent: 'center', gap: 5 },
    swipeText: { fontSize: 8, fontWeight: '800', color: TEXT_GREY, letterSpacing: 1 },
    bentoRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
    bentoSmall: { backgroundColor: CARD_WHITE, borderRadius: 30, padding: 20, height: 140 },
    statValue: { fontSize: 32, fontWeight: '900', color: TEXT_DARK },
    statUnit: { fontSize: 16, color: TEXT_GREY },
    statDesc: { fontSize: 11, color: TEXT_GREY, fontWeight: '600', marginTop: 4 },
    paAssistantCard: { backgroundColor: TEXT_DARK, borderWidth: 1.5 },
    paHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    paTitle: { fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
    paMessage: { color: '#FFF', fontSize: 15, lineHeight: 24, fontWeight: '500', fontStyle: 'italic' },
    aiFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 15, justifyContent: 'flex-end', gap: 6 },
    aiFooterText: { fontSize: 10, color: TEXT_GREY, fontWeight: '700' },
    pulseDot: { width: 8, height: 8, borderRadius: 4 },
    pillarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    pillarLabel: { width: 80, fontSize: 12, fontWeight: '700', color: TEXT_DARK },
    pillarTrack: { flex: 1, height: 8, backgroundColor: '#F5F5F0', borderRadius: 4, overflow: 'hidden', marginHorizontal: 12 },
    pillarFill: { height: '100%', borderRadius: 4 },
    pillarPercent: { width: 35, fontSize: 11, fontWeight: '800', color: TEXT_GREY }
});
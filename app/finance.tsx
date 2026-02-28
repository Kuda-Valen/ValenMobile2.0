import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  SafeAreaView, ScrollView,
  StatusBar,
  StyleSheet, Text,
  TextInput,
  TouchableOpacity, View
} from 'react-native';
import { useValen } from '../src/context/ValenContext';

const MINT_GREEN = '#00BFA5';
const GOAL_ICONS = ['star', 'home', 'car', 'airplane', 'gift', 'heart', 'laptop'];

export default function FinanceScreen() {
  const router = useRouter();
  const { financialData, addTransaction, addFinancialGoal, updateGoalProgress, profile } = useValen();
  
  // --- THEME MAPPING ---
  const isDark = profile?.theme === 'dark';
  const theme = {
    bg: isDark ? '#121212' : '#F5F5F0',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    textDark: isDark ? '#FFFFFF' : '#1A1A1A',
    textGrey: isDark ? '#A0A0A0' : '#8E8E93',
    itemBg: isDark ? '#2A2A2A' : '#F5F5F0',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EEE',
    wealthCard: isDark ? '#1A1A1A' : '#1A1A1A', // Maintaining dark command card
  };

  // VIEW STATE
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false); 
  const [fundModalVisible, setFundModalVisible] = useState(false);

  // FORM STATES
  const [amount, setAmount] = useState('');
  const [logType, setLogType] = useState<'Income' | 'Expense'>('Expense');
  const [category, setCategory] = useState('Food');
  const [selectedGoal, setSelectedGoal] = useState<any>(null);

  // NEW GOAL STATES
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalIcon, setGoalIcon] = useState('star');

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // --- MONTHLY FILTERING ---
  const filteredTransactions = useMemo(() => {
    return financialData.transactions.filter(t => {
      const transDate = new Date(t.date);
      return transDate.getMonth() === selectedMonth && transDate.getFullYear() === new Date().getFullYear();
    });
  }, [financialData.transactions, selectedMonth]);

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'Income') inc += Number(t.amount);
      else exp += Number(t.amount);
    });
    return { totalIncome: inc, totalExpenses: exp, balance: inc - exp };
  }, [filteredTransactions]);

  const handleFundGoal = async () => {
    if (!amount || !selectedGoal) return;
    await updateGoalProgress(selectedGoal.id, Number(amount));
    await addTransaction({
      amount: amount,
      category: `Savings: ${selectedGoal.name}`,
      type: 'Expense',
      date: new Date().toISOString()
    });
    setFundModalVisible(false);
    setAmount('');
  };

  const handleSaveTransaction = async () => {
    if (!amount) return;
    await addTransaction({
      amount: amount,
      category: category,
      type: logType,
      date: new Date().toISOString()
    });
    setLogModalVisible(false);
    setAmount('');
  };

  const handleCreateGoal = async () => {
    if (!goalName || !goalTarget) {
        Alert.alert("Missing Info", "Please provide a name and target amount.");
        return;
    }
    await addFinancialGoal({
        name: goalName,
        target: Number(goalTarget),
        current: 0,
        icon: goalIcon
    });
    setGoalModalVisible(false);
    setGoalName('');
    setGoalTarget('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card }]}>
          <Ionicons name="chevron-back" size={24} color={theme.textDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textDark }]}>Wealth Command</Text>
        <View style={[styles.currencyBadge, { backgroundColor: isDark ? 'rgba(0,191,165,0.1)' : '#E0F2F1' }]}><Text style={styles.currencyText}>ZAR (R)</Text></View>
      </View>

      {/* MONTH SELECTOR */}
      <View style={styles.monthStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {months.map((m, i) => (
            <TouchableOpacity 
              key={m} 
              onPress={() => setSelectedMonth(i)}
              style={[styles.monthTab, selectedMonth === i && { backgroundColor: isDark ? MINT_GREEN : theme.textDark }]}
            >
              <Text style={[styles.monthTabText, { color: theme.textGrey }, selectedMonth === i && { color: '#FFF' }]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* WEALTH CARD */}
        <View style={[styles.wealthCard, { backgroundColor: theme.wealthCard }]}>
            <Text style={styles.wealthLabel}>{months[selectedMonth]} Performance</Text>
            <Text style={styles.wealthAmount}>R{balance.toLocaleString()}</Text>
            <View style={styles.wealthFooter}>
                <View style={styles.wealthStat}>
                    <Text style={styles.statLabelHeader}>IN: R{totalIncome.toLocaleString()}</Text>
                </View>
                <View style={styles.wealthStat}>
                    <Text style={styles.statLabelHeader}>OUT: R{totalExpenses.toLocaleString()}</Text>
                </View>
            </View>
        </View>

        {/* GOALS SECTION */}
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textDark }]}>Savings Goals</Text>
            <TouchableOpacity onPress={() => setGoalModalVisible(true)} style={[styles.addSmallBtn, { backgroundColor: isDark ? 'rgba(0,191,165,0.1)' : '#F0FAF9' }]}>
                <Ionicons name="add" size={16} color={MINT_GREEN} />
                <Text style={styles.addSmallText}>New</Text>
            </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalsScroll}>
            {financialData.goals.map((goal) => (
              <View key={goal.id} style={[styles.goalCard, { backgroundColor: theme.card }]}>
                  <View style={styles.goalIconHeader}>
                    <Ionicons name={goal.icon as any} size={20} color={MINT_GREEN} />
                    <TouchableOpacity 
                      onPress={() => { setSelectedGoal(goal); setFundModalVisible(true); }}
                      style={styles.fundBtn}
                    >
                      <Ionicons name="add-circle" size={24} color={MINT_GREEN} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.goalName, { color: theme.textDark }]}>{goal.name}</Text>
                  <View style={[styles.progressBar, { backgroundColor: theme.itemBg }]}>
                    <View style={[styles.progressFill, { width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }]} />
                  </View>
                  <Text style={[styles.goalAmount, { color: theme.textGrey }]}>R{goal.current.toLocaleString()} / R{goal.target.toLocaleString()}</Text>
              </View>
            ))}
        </ScrollView>

        {/* TRANSACTIONS */}
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textDark }]}>Stream</Text>
            <View style={styles.row}>
                <TouchableOpacity onPress={() => { setLogType('Income'); setLogModalVisible(true); }} style={[styles.logBtnSmall, { backgroundColor: isDark ? 'rgba(46,125,50,0.1)' : '#E8F5E9' }]}>
                    <Text style={{ color: '#4CAF50', fontWeight: '700' }}>+ Income</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setLogType('Expense'); setLogModalVisible(true); }} style={[styles.logBtnSmall, { backgroundColor: isDark ? 'rgba(198,40,40,0.1)' : '#FFEBEE' }]}>
                    <Text style={{ color: '#F44336', fontWeight: '700' }}>- Expense</Text>
                </TouchableOpacity>
            </View>
        </View>

        {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
            <View key={t.id} style={[styles.transRow, { backgroundColor: theme.card }]}>
                <View style={[styles.transIcon, { backgroundColor: t.type === 'Income' ? (isDark ? 'rgba(46,125,50,0.1)' : '#E8F5E9') : theme.itemBg }]}>
                    <Ionicons name={t.type === 'Income' ? "trending-up" : "cart-outline"} size={20} color={t.type === 'Income' ? '#4CAF50' : theme.textDark} />
                </View>
                <View style={{flex: 1}}>
                    <Text style={[styles.transCat, { color: theme.textDark }]}>{t.category}</Text>
                    <Text style={[styles.transDate, { color: theme.textGrey }]}>{new Date(t.date).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.transAmount, { color: t.type === 'Income' ? '#4CAF50' : theme.textDark }]}>
                    {t.type === 'Income' ? '+' : '-'}R{Number(t.amount).toLocaleString()}
                </Text>
            </View>
        )) : (
          <Text style={[styles.emptyText, { color: theme.textGrey }]}>No transactions for {months[selectedMonth]}.</Text>
        )}
      </ScrollView>

      {/* FUND GOAL MODAL */}
      <Modal visible={fundModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" style={[styles.centerCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalHeading, { color: theme.textDark }]}>Fund {selectedGoal?.name}</Text>
            <TextInput 
              style={[styles.bigInput, { color: theme.textDark }]} 
              placeholder="R 0" 
              placeholderTextColor={theme.textGrey}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setFundModalVisible(false)} style={styles.btnSec}><Text style={styles.btnSecText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleFundGoal} style={styles.btnPrim}><Text style={styles.btnPrimText}>Add to Savings</Text></TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* NEW GOAL MODAL */}
      <Modal visible={goalModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" style={[styles.centerCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalHeading, { color: theme.textDark }]}>New Saving Goal</Text>
            <TextInput 
              style={[styles.inputStyle, { backgroundColor: theme.itemBg, color: theme.textDark }]} 
              placeholder="Goal Name (e.g. New Car)" 
              placeholderTextColor={theme.textGrey}
              value={goalName}
              onChangeText={setGoalName}
            />
            <TextInput 
              style={[styles.inputStyle, { backgroundColor: theme.itemBg, color: theme.textDark }]} 
              placeholder="Target Amount (R)" 
              placeholderTextColor={theme.textGrey}
              keyboardType="numeric"
              value={goalTarget}
              onChangeText={setGoalTarget}
            />
            <Text style={[styles.subLabel, { color: theme.textGrey }]}>Select Icon</Text>
            <View style={styles.iconRow}>
                {GOAL_ICONS.map(icon => (
                    <TouchableOpacity 
                        key={icon} 
                        style={[styles.iconBtn, { backgroundColor: theme.itemBg }, goalIcon === icon && {backgroundColor: MINT_GREEN}]} 
                        onPress={() => setGoalIcon(icon)}
                    >
                        <Ionicons name={icon as any} size={18} color={goalIcon === icon ? '#FFF' : theme.textGrey} />
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setGoalModalVisible(false)} style={styles.btnSec}><Text style={styles.btnSecText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleCreateGoal} style={styles.btnPrim}><Text style={styles.btnPrimText}>Create Goal</Text></TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* LOG TRANSACTION MODAL */}
      <Modal visible={logModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" style={[styles.centerCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalHeading, { color: theme.textDark }]}>Log {logType}</Text>
            <TextInput 
              style={[styles.bigInput, { color: theme.textDark }]} 
              placeholder="R 0" 
              placeholderTextColor={theme.textGrey}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
            <View style={styles.chipRow}>
                {(logType === 'Expense' ? ['Food', 'Rent', 'Transport', 'Sub'] : ['Salary', 'Freelance', 'Gift', 'Other']).map(c => (
                    <TouchableOpacity key={c} style={[styles.chip, { backgroundColor: theme.itemBg }, category === c && styles.activeChip]} onPress={() => setCategory(c)}>
                        <Text style={[styles.chipText, { color: theme.textGrey }, category === c && {color: '#FFF'}]}>{c}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setLogModalVisible(false)} style={styles.btnSec}><Text style={styles.btnSecText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSaveTransaction} style={styles.btnPrim}><Text style={styles.btnPrimText}>Confirm</Text></TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { width: 45, height: 45, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  currencyBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  currencyText: { color: MINT_GREEN, fontWeight: '800', fontSize: 10 },
  
  monthStrip: { marginBottom: 10 },
  monthTab: { paddingHorizontal: 18, paddingVertical: 8, marginRight: 10, borderRadius: 20 },
  monthTabText: { fontWeight: '700', fontSize: 14 },

  scrollContent: { padding: 20 },
  wealthCard: { borderRadius: 32, padding: 25, marginBottom: 30, elevation: 8 },
  wealthLabel: { color: '#8E8E93', fontSize: 12, fontWeight: '700' },
  wealthAmount: { color: '#FFF', fontSize: 38, fontWeight: '900', marginVertical: 8 },
  wealthFooter: { flexDirection: 'row', gap: 20, marginTop: 10, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 15 },
  statLabelHeader: { color: '#EEE', fontSize: 13, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  addSmallBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  addSmallText: { color: MINT_GREEN, fontWeight: '700', fontSize: 12, marginLeft: 4 },
  logBtnSmall: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginLeft: 10 },

  goalsScroll: { marginBottom: 30 },
  goalCard: { width: 180, padding: 20, borderRadius: 28, marginRight: 15, elevation: 3 },
  goalIconHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fundBtn: { padding: 2 },
  goalName: { fontSize: 15, fontWeight: '800', marginTop: 12 },
  progressBar: { height: 6, borderRadius: 10, marginVertical: 10 },
  progressFill: { height: '100%', backgroundColor: MINT_GREEN },
  goalAmount: { fontSize: 10, fontWeight: '700' },

  transRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 16, padding: 12, borderRadius: 20 },
  transIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  transCat: { fontSize: 15, fontWeight: '700' },
  transDate: { fontSize: 11 },
  transAmount: { fontSize: 15, fontWeight: '800' },
  emptyText: { textAlign: 'center', marginVertical: 20, fontStyle: 'italic' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  centerCard: { borderRadius: 32, padding: 25 },
  modalHeading: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  bigInput: { fontSize: 48, fontWeight: '900', textAlign: 'center', marginVertical: 20 },
  inputStyle: { padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16, fontWeight: '600' },
  subLabel: { fontSize: 12, fontWeight: '800', marginBottom: 10 },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 25 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  activeChip: { backgroundColor: MINT_GREEN },
  chipText: { fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 15, justifyContent: 'flex-end' },
  btnSec: { padding: 12 },
  btnSecText: { fontWeight: '700' },
  btnPrim: { backgroundColor: MINT_GREEN, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 16 },
  btnPrimText: { color: '#FFF', fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center' }
});
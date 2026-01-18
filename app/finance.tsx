import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  SafeAreaView, ScrollView, StyleSheet, Text,
  TextInput,
  TouchableOpacity, View
} from 'react-native';
import { useValen } from '../src/context/ValenContext';

const CREAM_BG = '#F5F5F0';
const CARD_WHITE = '#FFFFFF';
const MINT_GREEN = '#00BFA5';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';

const GOAL_ICONS = ['star', 'home', 'car', 'airplane', 'gift', 'heart', 'laptop'];

export default function FinanceScreen() {
  const router = useRouter();
  const { financialData, addTransaction, addFinancialGoal, updateGoalProgress } = useValen();
  
  // VIEW STATE
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false); // New Goal State
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
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wealth Command</Text>
        <View style={styles.currencyBadge}><Text style={styles.currencyText}>ZAR (R)</Text></View>
      </View>

      {/* MONTH SELECTOR */}
      <View style={styles.monthStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {months.map((m, i) => (
            <TouchableOpacity 
              key={m} 
              onPress={() => setSelectedMonth(i)}
              style={[styles.monthTab, selectedMonth === i && styles.activeMonthTab]}
            >
              <Text style={[styles.monthTabText, selectedMonth === i && styles.activeMonthTabText]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* WEALTH CARD */}
        <View style={styles.wealthCard}>
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
            <Text style={styles.sectionTitle}>Savings Goals</Text>
            <TouchableOpacity onPress={() => setGoalModalVisible(true)} style={styles.addSmallBtn}>
                <Ionicons name="add" size={16} color={MINT_GREEN} />
                <Text style={styles.addSmallText}>New</Text>
            </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalsScroll}>
            {financialData.goals.map((goal) => (
              <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalIconHeader}>
                    <Ionicons name={goal.icon as any} size={20} color={MINT_GREEN} />
                    <TouchableOpacity 
                      onPress={() => { setSelectedGoal(goal); setFundModalVisible(true); }}
                      style={styles.fundBtn}
                    >
                      <Ionicons name="add-circle" size={24} color={MINT_GREEN} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }]} />
                  </View>
                  <Text style={styles.goalAmount}>R{goal.current.toLocaleString()} / R{goal.target.toLocaleString()}</Text>
              </View>
            ))}
        </ScrollView>

        {/* TRANSACTIONS */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Stream</Text>
            <View style={styles.row}>
                <TouchableOpacity onPress={() => { setLogType('Income'); setLogModalVisible(true); }} style={[styles.logBtnSmall, { backgroundColor: '#E8F5E9' }]}>
                    <Text style={{ color: '#2E7D32', fontWeight: '700' }}>+ Income</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setLogType('Expense'); setLogModalVisible(true); }} style={[styles.logBtnSmall, { backgroundColor: '#FFEBEE' }]}>
                    <Text style={{ color: '#C62828', fontWeight: '700' }}>- Expense</Text>
                </TouchableOpacity>
            </View>
        </View>

        {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
            <View key={t.id} style={styles.transRow}>
                <View style={[styles.transIcon, { backgroundColor: t.type === 'Income' ? '#E8F5E9' : '#F5F5F0' }]}>
                    <Ionicons name={t.type === 'Income' ? "trending-up" : "cart-outline"} size={20} color={t.type === 'Income' ? '#2E7D32' : TEXT_DARK} />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.transCat}>{t.category}</Text>
                    <Text style={styles.transDate}>{new Date(t.date).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.transAmount, { color: t.type === 'Income' ? '#2E7D32' : TEXT_DARK }]}>
                    {t.type === 'Income' ? '+' : '-'}R{Number(t.amount).toLocaleString()}
                </Text>
            </View>
        )) : (
          <Text style={styles.emptyText}>No transactions for {months[selectedMonth]}.</Text>
        )}
      </ScrollView>

      {/* FUND GOAL MODAL */}
      <Modal visible={fundModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" style={styles.centerCard}>
            <Text style={styles.modalHeading}>Fund {selectedGoal?.name}</Text>
            <TextInput 
              style={styles.bigInput} 
              placeholder="R 0" 
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
          <KeyboardAvoidingView behavior="padding" style={styles.centerCard}>
            <Text style={styles.modalHeading}>New Saving Goal</Text>
            <TextInput 
              style={styles.inputStyle} 
              placeholder="Goal Name (e.g. New Car)" 
              value={goalName}
              onChangeText={setGoalName}
            />
            <TextInput 
              style={styles.inputStyle} 
              placeholder="Target Amount (R)" 
              keyboardType="numeric"
              value={goalTarget}
              onChangeText={setGoalTarget}
            />
            <Text style={styles.subLabel}>Select Icon</Text>
            <View style={styles.iconRow}>
                {GOAL_ICONS.map(icon => (
                    <TouchableOpacity 
                        key={icon} 
                        style={[styles.iconBtn, goalIcon === icon && {backgroundColor: MINT_GREEN}]} 
                        onPress={() => setGoalIcon(icon)}
                    >
                        <Ionicons name={icon as any} size={18} color={goalIcon === icon ? '#FFF' : TEXT_GREY} />
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
          <KeyboardAvoidingView behavior="padding" style={styles.centerCard}>
            <Text style={styles.modalHeading}>Log {logType}</Text>
            <TextInput 
              style={styles.bigInput} 
              placeholder="R 0" 
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
            <View style={styles.chipRow}>
                {(logType === 'Expense' ? ['Food', 'Rent', 'Transport', 'Sub'] : ['Salary', 'Freelance', 'Gift', 'Other']).map(c => (
                    <TouchableOpacity key={c} style={[styles.chip, category === c && styles.activeChip]} onPress={() => setCategory(c)}>
                        <Text style={[styles.chipText, category === c && {color: '#FFF'}]}>{c}</Text>
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
  container: { flex: 1, backgroundColor: CREAM_BG },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { width: 45, height: 45, borderRadius: 22, backgroundColor: CARD_WHITE, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: TEXT_DARK },
  currencyBadge: { backgroundColor: '#E0F2F1', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  currencyText: { color: MINT_GREEN, fontWeight: '800', fontSize: 10 },
  
  monthStrip: { marginBottom: 10 },
  monthTab: { paddingHorizontal: 18, paddingVertical: 8, marginRight: 10, borderRadius: 20 },
  activeMonthTab: { backgroundColor: TEXT_DARK },
  monthTabText: { color: TEXT_GREY, fontWeight: '700', fontSize: 14 },
  activeMonthTabText: { color: '#FFF' },

  scrollContent: { padding: 20 },
  wealthCard: { backgroundColor: TEXT_DARK, borderRadius: 32, padding: 25, marginBottom: 30, elevation: 8 },
  wealthLabel: { color: TEXT_GREY, fontSize: 12, fontWeight: '700' },
  wealthAmount: { color: '#FFF', fontSize: 38, fontWeight: '900', marginVertical: 8 },
  wealthFooter: { flexDirection: 'row', gap: 20, marginTop: 10, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 15 },
  statLabelHeader: { color: '#EEE', fontSize: 13, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: TEXT_DARK },
  addSmallBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FAF9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  addSmallText: { color: MINT_GREEN, fontWeight: '700', fontSize: 12, marginLeft: 4 },
  logBtnSmall: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginLeft: 10 },

  goalsScroll: { marginBottom: 30 },
  goalCard: { backgroundColor: CARD_WHITE, width: 180, padding: 20, borderRadius: 28, marginRight: 15, elevation: 3 },
  goalIconHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fundBtn: { padding: 2 },
  goalName: { fontSize: 15, fontWeight: '800', marginTop: 12 },
  progressBar: { height: 6, backgroundColor: '#F5F5F0', borderRadius: 10, marginVertical: 10 },
  progressFill: { height: '100%', backgroundColor: MINT_GREEN },
  goalAmount: { fontSize: 10, color: TEXT_GREY, fontWeight: '700' },

  transRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 16, backgroundColor: CARD_WHITE, padding: 12, borderRadius: 20 },
  transIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  transCat: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  transDate: { fontSize: 11, color: TEXT_GREY },
  transAmount: { fontSize: 15, fontWeight: '800' },
  emptyText: { textAlign: 'center', color: TEXT_GREY, marginVertical: 20, fontStyle: 'italic' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  centerCard: { backgroundColor: CARD_WHITE, borderRadius: 32, padding: 25 },
  modalHeading: { fontSize: 18, fontWeight: '900', color: TEXT_DARK, textAlign: 'center' },
  bigInput: { fontSize: 48, fontWeight: '900', textAlign: 'center', color: TEXT_DARK, marginVertical: 20 },
  inputStyle: { backgroundColor: '#F5F5F0', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16, fontWeight: '600', color: TEXT_DARK },
  subLabel: { fontSize: 12, color: TEXT_GREY, fontWeight: '800', marginBottom: 10 },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F5F0', justifyContent: 'center', alignItems: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 25 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F5F5F0' },
  activeChip: { backgroundColor: MINT_GREEN },
  chipText: { fontWeight: '700', color: TEXT_GREY },
  modalActions: { flexDirection: 'row', gap: 15, justifyContent: 'flex-end' },
  btnSec: { padding: 12 },
  btnSecText: { color: TEXT_GREY, fontWeight: '700' },
  btnPrim: { backgroundColor: MINT_GREEN, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 16 },
  btnPrimText: { color: '#FFF', fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center' }
});
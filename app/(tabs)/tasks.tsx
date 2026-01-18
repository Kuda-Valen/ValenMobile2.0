import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import AddTaskModal from '../../components/AddTaskModal';
import { useValen } from '../../src/context/ValenContext';
import { NotificationService } from '../../src/services/NotificationService';

const { width, height } = Dimensions.get('window');
const MINT_GREEN = '#00BFA5';

export default function TasksScreen() {
  const { profile, tasks, folders, toggleTaskCompletion, addFolder, addTask } = useValen();
  
  // --- THEME LOGIC ---
  const isDark = profile?.theme === 'dark';
  const COLORS = {
    bg: isDark ? '#121212' : '#F5F5F0',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    textDark: isDark ? '#FFFFFF' : '#1A1A1A',
    textGrey: isDark ? '#A0A0A0' : '#8E8E93',
    border: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5E0',
    itemBg: isDark ? '#252525' : '#FAFAFA',
    inputBg: isDark ? '#2A2A2A' : '#F5F5F0'
  };

  // Folder States
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Universal Add Task State
  const [taskModalVisible, setTaskModalVisible] = useState(false);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await addFolder(newFolderName, 'folder');
    setNewFolderName('');
    setFolderModalVisible(false);
  };

  const handleSaveTask = async (taskData: any) => {
    const newTask = {
      title: taskData.title,
      folder: taskData.folder,
      priority: taskData.priority,
      dueDate: taskData.date,
      dueTime: taskData.time || null
    };
    
    await addTask(newTask);

    if (taskData.time && taskData.fullDate) {
      try {
        const [hours, minutes] = taskData.time.split(':');
        const reminderDate = new Date(taskData.fullDate);
        reminderDate.setHours(parseInt(hours), parseInt(minutes), 0);

        if (reminderDate > new Date()) {
          await NotificationService.scheduleTaskReminder(
            Math.random().toString(), 
            taskData.title,
            reminderDate.getTime() 
          );
        }
      } catch (error) {
        console.error("Failed to schedule notification:", error);
      }
    }
    setTaskModalVisible(false);
  };

  const getTaskCount = (folderName: string) => {
    return tasks.filter(t => t.folder === folderName && !t.completed).length;
  };

  const activeTasks = tasks.filter(t => t.folder === selectedFolder);
  const currentMonth = new Date().toLocaleString('default', { month: 'short' });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: COLORS.textDark }]}>Collections</Text>
        <TouchableOpacity 
          style={[styles.addFolderBtn, { backgroundColor: COLORS.card }]} 
          onPress={() => setTaskModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={MINT_GREEN} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {folders.map((folder) => (
            <TouchableOpacity 
              key={folder.id} 
              style={[styles.folderCard, { backgroundColor: COLORS.card }]}
              onPress={() => setSelectedFolder(folder.name)}
            >
              <View style={styles.folderIconHeader}>
                <Ionicons name={folder.icon || 'folder'} size={22} color={MINT_GREEN} />
                <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(0,191,165,0.1)' : '#F0FAF9' }]}><Text style={styles.badgeText}>{getTaskCount(folder.name)}</Text></View>
              </View>
              <View>
                <Text style={[styles.folderName, { color: COLORS.textDark }]}>{folder.name}</Text>
                <Text style={[styles.folderCount, { color: COLORS.textGrey }]}>View All</Text>
              </View>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            style={[styles.folderCard, styles.dottedBorder, { borderColor: COLORS.border }]} 
            onPress={() => setFolderModalVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={32} color={COLORS.textGrey} />
            <Text style={[styles.addText, { color: COLORS.textGrey }]}>New Folder</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL: CREATE NEW FOLDER */}
      <Modal visible={folderModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.smallModalSheet, { backgroundColor: COLORS.card }]}>
            <Text style={[styles.modalHeading, { color: COLORS.textDark }]}>New Collection</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: COLORS.inputBg, color: COLORS.textDark }]}
              placeholder="Collection Name"
              placeholderTextColor={COLORS.textGrey}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setFolderModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateFolder} style={styles.createBtn}>
                <Text style={styles.createText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AddTaskModal 
        visible={taskModalVisible}
        onClose={() => setTaskModalVisible(false)}
        folders={folders}
        onSave={handleSaveTask}
        initialFolder={selectedFolder || 'Personal'}
      />

      {/* MODAL: FOLDER DETAIL VIEW */}
      <Modal visible={!!selectedFolder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.detailSheet, { backgroundColor: COLORS.card }]}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={[styles.detailTitle, { color: COLORS.textDark }]}>{selectedFolder}</Text>
                <Text style={[styles.folderSub, { color: COLORS.textGrey }]}>{activeTasks.length} total tasks</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFolder(null)}>
                <Ionicons name="close-circle" size={32} color={isDark ? "#333" : "#DDD"} />
              </TouchableOpacity>
            </View>

            <FlatList 
              data={activeTasks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[styles.taskItem, { backgroundColor: COLORS.itemBg }]}>
                  <TouchableOpacity 
                    style={[styles.checkbox, { borderColor: isDark ? '#444' : '#DDD' }, item.completed && styles.checked]} 
                    onPress={() => toggleTaskCompletion(item.id, item.completed)}
                  >
                    {item.completed && <Ionicons name="checkmark" size={16} color="#FFF" />}
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskTitle, { color: COLORS.textDark }, item.completed && styles.strikethrough]}>{item.title}</Text>
                    <Text style={[styles.taskSub, { color: COLORS.textGrey }]}>{item.priority} • Due {currentMonth} {item.dueDate}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={[styles.emptyText, { color: COLORS.textGrey }]}>No tasks here yet.</Text>}
            />

            <TouchableOpacity 
              style={styles.folderAddBtn} 
              onPress={() => setTaskModalVisible(true)}
            >
              <Ionicons name="add" size={24} color="#FFF" />
              <Text style={styles.folderAddBtnText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: '800' },
  addFolderBtn: { padding: 8, borderRadius: 12 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  folderCard: { width: (width - 55) / 2, height: 150, borderRadius: 24, padding: 20, marginBottom: 15, justifyContent: 'space-between', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  folderIconHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700', color: MINT_GREEN },
  folderName: { fontSize: 18, fontWeight: '700' },
  folderCount: { fontSize: 12, marginTop: 4 },
  dottedBorder: { borderWidth: 2, borderStyle: 'dashed', backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  addText: { fontWeight: '600', marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  smallModalSheet: { width: '85%', borderRadius: 24, padding: 24 },
  modalHeading: { fontSize: 18, fontWeight: '800' },
  input: { padding: 15, borderRadius: 12, fontSize: 16, marginTop: 15 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: '#8E8E93', fontWeight: '600' },
  createBtn: { flex: 2, backgroundColor: MINT_GREEN, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  createText: { color: '#FFF', fontWeight: '700' },
  detailSheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, height: height * 0.85, padding: 25 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  detailTitle: { fontSize: 26, fontWeight: '800' },
  folderSub: { fontSize: 14, marginTop: 2 },
  taskItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, padding: 15, borderRadius: 16 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  checked: { backgroundColor: MINT_GREEN, borderColor: MINT_GREEN },
  taskTitle: { fontSize: 16, fontWeight: '600' },
  strikethrough: { textDecorationLine: 'line-through', color: '#8E8E93' },
  taskSub: { fontSize: 12, marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 40 },
  folderAddBtn: { backgroundColor: MINT_GREEN, flexDirection: 'row', height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: MINT_GREEN, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 8 }, shadowRadius: 12 },
  folderAddBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16, marginLeft: 8 }
});
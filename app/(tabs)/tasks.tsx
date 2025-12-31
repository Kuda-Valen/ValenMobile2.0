import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useValen } from '../../src/context/ValenContext';

const { width, height } = Dimensions.get('window');
const CREAM_BG = '#F5F5F0';
const CARD_WHITE = '#FFFFFF';
const MINT_GREEN = '#00BFA5';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';

export default function TasksScreen() {
  const { tasks, folders, toggleTaskCompletion, addFolder, addTask } = useValen();
  
  // Folder States
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Task Creation States (within folder)
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await addFolder(newFolderName, 'folder');
    setNewFolderName('');
    setFolderModalVisible(false);
  };

  const handleSaveTask = async () => {
    if (!taskTitle || !selectedFolder) return;
    await addTask({
      title: taskTitle,
      folder: selectedFolder,
      priority: taskPriority,
      dueDate: new Date().getDate(), // Default to today for quick add
    });
    setTaskTitle('');
    setTaskModalVisible(false);
  };

  const getTaskCount = (folderName: string) => {
    return tasks.filter(t => t.folder === folderName && !t.completed).length;
  };

  const activeTasks = tasks.filter(t => t.folder === selectedFolder);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Collections</Text>
        <TouchableOpacity style={styles.addFolderBtn} onPress={() => setFolderModalVisible(true)}>
          <Ionicons name="add" size={24} color={MINT_GREEN} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {folders.map((folder) => (
            <TouchableOpacity 
              key={folder.id} 
              style={styles.folderCard}
              onPress={() => setSelectedFolder(folder.name)}
            >
              <View style={styles.folderIconHeader}>
                <Ionicons name={folder.icon || 'folder'} size={22} color={MINT_GREEN} />
                <View style={styles.badge}><Text style={styles.badgeText}>{getTaskCount(folder.name)}</Text></View>
              </View>
              <View>
                <Text style={styles.folderName}>{folder.name}</Text>
                <Text style={styles.folderCount}>View All</Text>
              </View>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={[styles.folderCard, styles.dottedBorder]} onPress={() => setFolderModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={32} color={TEXT_GREY} />
            <Text style={styles.addText}>New Folder</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL: CREATE NEW FOLDER */}
      <Modal visible={folderModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.smallModalSheet}>
            <Text style={styles.modalHeading}>New Collection</Text>
            <TextInput 
              style={styles.input}
              placeholder="Collection Name"
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

      {/* MODAL: FOLDER DETAIL VIEW */}
      <Modal visible={!!selectedFolder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.detailSheet}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailTitle}>{selectedFolder}</Text>
                <Text style={styles.folderSub}>{activeTasks.length} total tasks</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFolder(null)}>
                <Ionicons name="close-circle" size={32} color="#DDD" />
              </TouchableOpacity>
            </View>

            <FlatList 
              data={activeTasks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.taskItem}>
                  <TouchableOpacity 
                    style={[styles.checkbox, item.completed && styles.checked]} 
                    onPress={() => toggleTaskCompletion(item.id, item.completed)}
                  >
                    {item.completed && <Ionicons name="checkmark" size={16} color="#FFF" />}
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskTitle, item.completed && styles.strikethrough]}>{item.title}</Text>
                    <Text style={styles.taskSub}>{item.priority} • Due Dec {item.dueDate}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No tasks here yet.</Text>}
            />

            {/* ADD TASK BUTTON INSIDE FOLDER */}
            <TouchableOpacity 
              style={styles.folderAddBtn} 
              onPress={() => setTaskModalVisible(true)}
            >
              <Ionicons name="add" size={24} color="#FFF" />
              <Text style={styles.folderAddBtnText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* NESTED MODAL: QUICK ADD TASK */}
        <Modal visible={taskModalVisible} animationType="fade" transparent>
          <View style={styles.modalOverlayCenter}>
            <View style={styles.smallModalSheet}>
              <Text style={styles.modalHeading}>Task in {selectedFolder}</Text>
              <TextInput 
                style={styles.input}
                placeholder="What's the task?"
                value={taskTitle}
                onChangeText={setTaskTitle}
                autoFocus
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setTaskModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveTask} style={styles.createBtn}>
                  <Text style={styles.createText}>Add Task</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM_BG },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: '800', color: TEXT_DARK },
  addFolderBtn: { backgroundColor: CARD_WHITE, padding: 8, borderRadius: 12 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  folderCard: { backgroundColor: CARD_WHITE, width: (width - 55) / 2, height: 150, borderRadius: 24, padding: 20, marginBottom: 15, justifyContent: 'space-between' },
  folderIconHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { backgroundColor: '#F0FAF9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700', color: MINT_GREEN },
  folderName: { fontSize: 18, fontWeight: '700', color: TEXT_DARK },
  folderCount: { fontSize: 12, color: TEXT_GREY, marginTop: 4 },
  dottedBorder: { borderWidth: 2, borderColor: '#E5E5E0', borderStyle: 'dashed', backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  addText: { color: TEXT_GREY, fontWeight: '600', marginTop: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  smallModalSheet: { backgroundColor: '#FFF', width: '85%', borderRadius: 24, padding: 24 },
  modalHeading: { fontSize: 18, fontWeight: '800', color: TEXT_DARK },
  input: { backgroundColor: '#F5F5F0', padding: 15, borderRadius: 12, fontSize: 16, marginTop: 15, color: TEXT_DARK },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: TEXT_GREY, fontWeight: '600' },
  createBtn: { flex: 2, backgroundColor: MINT_GREEN, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  createText: { color: '#FFF', fontWeight: '700' },

  detailSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: height * 0.85, padding: 25 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  detailTitle: { fontSize: 26, fontWeight: '800', color: TEXT_DARK },
  folderSub: { fontSize: 14, color: TEXT_GREY, marginTop: 2 },
  taskItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#FAFAFA', padding: 15, borderRadius: 16 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#DDD', marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  checked: { backgroundColor: MINT_GREEN, borderColor: MINT_GREEN },
  taskTitle: { fontSize: 16, fontWeight: '600', color: TEXT_DARK },
  strikethrough: { textDecorationLine: 'line-through', color: TEXT_GREY },
  taskSub: { fontSize: 12, color: TEXT_GREY, marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 40, color: TEXT_GREY },

  folderAddBtn: { 
    backgroundColor: MINT_GREEN, 
    flexDirection: 'row', 
    height: 56, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 10,
    shadowColor: MINT_GREEN,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12
  },
  folderAddBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16, marginLeft: 8 }
});
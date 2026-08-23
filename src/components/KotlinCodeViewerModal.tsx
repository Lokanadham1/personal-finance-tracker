import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Code2,
  Copy,
  Check,
  X,
  FileCode,
  Smartphone,
  Download,
  FolderTree,
  Terminal,
} from 'lucide-react';

interface KotlinCodeSnippet {
  filename: string;
  packagePath: string;
  description: string;
  code: string;
}

const KOTLIN_FILES: KotlinCodeSnippet[] = [
  {
    filename: 'TransactionEntity.kt',
    packagePath: 'data/local/entity',
    description: 'Room Database Entity definition',
    code: `package com.example.financetracker.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class TransactionType {
    INCOME,
    EXPENSE
}

@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val type: TransactionType,
    val amount: Double,
    val category: String, // E.g., Food, Rent, Transport, Shopping, Other, or Income Source
    val description: String,
    val date: String,     // Format: YYYY-MM-DD
    val timestamp: Long = System.currentTimeMillis()
)`,
  },
  {
    filename: 'TransactionDao.kt',
    packagePath: 'data/local/dao',
    description: 'Room Data Access Object (DAO) with reactive StateFlow/Flow queries',
    code: `package com.example.financetracker.data.local.dao

import androidx.room.*
import com.example.financetracker.data.local.entity.TransactionEntity
import com.example.financetracker.data.local.entity.TransactionType
import kotlinx.coroutines.flow.Flow

@Dao
interface TransactionDao {
    @Query("SELECT * FROM transactions ORDER BY date DESC, timestamp DESC")
    fun getAllTransactionsFlow(): Flow<List<TransactionEntity>>

    @Query("SELECT * FROM transactions WHERE type = :type ORDER BY date DESC")
    fun getTransactionsByTypeFlow(type: TransactionType): Flow<List<TransactionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(transaction: TransactionEntity): Long

    @Delete
    suspend fun deleteTransaction(transaction: TransactionEntity)

    @Query("DELETE FROM transactions WHERE id = :id")
    suspend fun deleteTransactionById(id: Long)

    @Query("SELECT SUM(amount) FROM transactions WHERE type = 'INCOME'")
    fun getTotalIncomeFlow(): Flow<Double?>

    @Query("SELECT SUM(amount) FROM transactions WHERE type = 'EXPENSE'")
    fun getTotalExpenseFlow(): Flow<Double?>
}`,
  },
  {
    filename: 'AppDatabase.kt',
    packagePath: 'data/local',
    description: 'Room Database Singleton Setup',
    code: `package com.example.financetracker.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.financetracker.data.local.dao.TransactionDao
import com.example.financetracker.data.local.entity.TransactionEntity

@Database(entities = [TransactionEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun transactionDao(): TransactionDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "finance_tracker_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}`,
  },
  {
    filename: 'FinanceRepository.kt',
    packagePath: 'data/repository',
    description: 'Offline-First Repository pattern',
    code: `package com.example.financetracker.data.repository

import com.example.financetracker.data.local.dao.TransactionDao
import com.example.financetracker.data.local.entity.TransactionEntity
import com.example.financetracker.data.local.entity.TransactionType
import kotlinx.coroutines.flow.Flow

class FinanceRepository(private val dao: TransactionDao) {
    val allTransactions: Flow<List<TransactionEntity>> = dao.getAllTransactionsFlow()
    val totalIncome: Flow<Double?> = dao.getTotalIncomeFlow()
    val totalExpense: Flow<Double?> = dao.getTotalExpenseFlow()

    suspend fun addTransaction(transaction: TransactionEntity) {
        dao.insertTransaction(transaction)
    }

    suspend fun deleteTransaction(transaction: TransactionEntity) {
        dao.deleteTransaction(transaction)
    }

    suspend fun deleteById(id: Long) {
        dao.deleteTransactionById(id)
    }
}`,
  },
  {
    filename: 'FinanceViewModel.kt',
    packagePath: 'ui/viewmodel',
    description: 'MVVM ViewModel with StateFlow calculations',
    code: `package com.example.financetracker.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.financetracker.data.local.entity.TransactionEntity
import com.example.financetracker.data.local.entity.TransactionType
import com.example.financetracker.data.repository.FinanceRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class CategoryExpense(
    val category: String,
    val total: Double,
    val percentage: Float
)

data class FinanceUiState(
    val transactions: List<TransactionEntity> = emptyList(),
    val totalIncome: Double = 0.0,
    val totalExpense: Double = 0.0,
    val remainingBalance: Double = 0.0,
    val categoryBreakdown: List<CategoryExpense> = emptyList(),
    val isLoading: Boolean = false
)

class FinanceViewModel(private val repository: FinanceRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(FinanceUiState(isLoading = true))
    val uiState: StateFlow<FinanceUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.allTransactions.collect { txList ->
                val income = txList.filter { it.type == TransactionType.INCOME }.sumOf { it.amount }
                val expense = txList.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amount }
                val balance = income - expense

                val expensesOnly = txList.filter { it.type == TransactionType.EXPENSE }
                val categories = listOf("Food", "Rent", "Transport", "Shopping", "Other")
                val breakdown = categories.map { cat ->
                    val catTotal = expensesOnly.filter { it.category == cat }.sumOf { it.amount }
                    val percent = if (expense > 0) (catTotal / expense * 100).toFloat() else 0f
                    CategoryExpense(cat, catTotal, percent)
                }.sortedByDescending { it.total }

                _uiState.value = FinanceUiState(
                    transactions = txList,
                    totalIncome = income,
                    totalExpense = expense,
                    remainingBalance = balance,
                    categoryBreakdown = breakdown,
                    isLoading = false
                )
            }
        }
    }

    fun addIncome(amount: Double, source: String, date: String) {
        viewModelScope.launch {
            val entity = TransactionEntity(
                type = TransactionType.INCOME,
                amount = amount,
                category = source,
                description = "$source Income",
                date = date
            )
            repository.addTransaction(entity)
        }
    }

    fun addExpense(amount: Double, category: String, description: String, date: String) {
        viewModelScope.launch {
            val entity = TransactionEntity(
                type = TransactionType.EXPENSE,
                amount = amount,
                category = category,
                description = description.ifBlank { "$category Expense" },
                date = date
            )
            repository.addTransaction(entity)
        }
    }

    fun deleteTransaction(transaction: TransactionEntity) {
        viewModelScope.launch {
            repository.deleteTransaction(transaction)
        }
    }
}`,
  },
  {
    filename: 'HomeScreen.kt',
    packagePath: 'ui/screens',
    description: 'Jetpack Compose Material 3 Dashboard with Total Income, Total Spent, Remaining Balance cards',
    code: `package com.example.financetracker.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.financetracker.data.local.entity.TransactionType
import com.example.financetracker.ui.viewmodel.FinanceUiState

@Composable
fun HomeScreen(
    uiState: FinanceUiState,
    onNavigateToAdd: () -> Unit,
    onNavigateToTransactions: () -> Unit
) {
    val isPositive = uiState.remainingBalance >= 0

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Remaining Balance Card (Blue if positive, Red if negative)
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (isPositive) Color(0xFF005CB2) else Color(0xFFBA1A1A)
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text("Remaining Balance", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "$%.2f".format(uiState.remainingBalance),
                        color = Color.White,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // 2. Total Income (Green) & Total Spent (Red) Cards
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Total Income (Green Card)
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F5E9))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Total Income", color = Color(0xFF2E7D32), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "+$%.2f".format(uiState.totalIncome),
                            color = Color(0xFF1B5E20),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // Total Spent (Red Card)
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFEBEE))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Total Spent", color = Color(0xFFC62828), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "-$%.2f".format(uiState.totalExpense),
                            color = Color(0xFFB71C1C),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // Recent Activity Section
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Recent Transactions", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                TextButton(onClick = onNavigateToTransactions) {
                    Text("View All")
                }
            }
        }

        items(uiState.transactions.take(5)) { tx ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(tx.description, fontWeight = FontWeight.SemiBold)
                        Text("\${tx.category} • \${tx.date}", fontSize = 12.sp, color = Color.Gray)
                    }
                    val isIncome = tx.type == TransactionType.INCOME
                    Text(
                        text = if (isIncome) "+$%.2f".format(tx.amount) else "-$%.2f".format(tx.amount),
                        color = if (isIncome) Color(0xFF2E7D32) else Color(0xFFC62828),
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}`,
  },
  {
    filename: 'MainActivity.kt',
    packagePath: 'ui',
    description: 'Jetpack Compose Navigation & Material 3 Scaffold Entry Point',
    code: `package com.example.financetracker.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.financetracker.data.local.AppDatabase
import com.example.financetracker.data.repository.FinanceRepository
import com.example.financetracker.ui.screens.*
import com.example.financetracker.ui.theme.FinanceTrackerTheme
import com.example.financetracker.ui.viewmodel.FinanceViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val database = AppDatabase.getDatabase(this)
        val repository = FinanceRepository(database.transactionDao())

        setContent {
            FinanceTrackerTheme {
                var selectedTab by remember { mutableStateOf(0) }
                val viewModel: FinanceViewModel = viewModel { FinanceViewModel(repository) }
                val uiState by viewModel.uiState.collectAsState()

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    bottomBar = {
                        NavigationBar {
                            NavigationBarItem(
                                selected = selectedTab == 0,
                                onClick = { selectedTab = 0 },
                                icon = { Icon(Icons.Default.Home, "Home") },
                                label = { Text("Home") }
                            )
                            NavigationBarItem(
                                selected = selectedTab == 1,
                                onClick = { selectedTab = 1 },
                                icon = { Icon(Icons.Default.List, "Transactions") },
                                label = { Text("Transactions") }
                            )
                            NavigationBarItem(
                                selected = selectedTab == 2,
                                onClick = { selectedTab = 2 },
                                icon = { Icon(Icons.Default.AddCircle, "Add Entry") },
                                label = { Text("Add Entry") }
                            )
                        }
                    }
                ) { innerPadding ->
                    Surface(modifier = Modifier.padding(innerPadding)) {
                        when (selectedTab) {
                            0 -> HomeScreen(
                                uiState = uiState,
                                onNavigateToAdd = { selectedTab = 2 },
                                onNavigateToTransactions = { selectedTab = 1 }
                            )
                            1 -> TransactionListScreen(
                                transactions = uiState.transactions,
                                onDelete = { viewModel.deleteTransaction(it) }
                            )
                            2 -> AddEntryScreen(
                                onAddIncome = { amt, src, date ->
                                    viewModel.addIncome(amt, src, date)
                                    selectedTab = 1
                                },
                                onAddExpense = { amt, cat, desc, date ->
                                    viewModel.addExpense(amt, cat, desc, date)
                                    selectedTab = 1
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}`,
  },
];

export function KotlinCodeViewerModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentFile = KOTLIN_FILES[selectedFileIndex];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1e1e24] border border-neutral-700/60 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#18181c] border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Android Jetpack Compose & Room Kotlin Source</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                  Kotlin 2.0+
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Production-ready code architecture for Android Studio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded-lg text-neutral-200 transition-colors cursor-pointer border border-neutral-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy File'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: File Sidebar + Code View */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-full md:w-64 bg-[#141416] border-r border-neutral-800 p-2.5 flex flex-col gap-1 overflow-y-auto shrink-0">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 px-2 py-1 flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5" />
              <span>Project Files ({KOTLIN_FILES.length})</span>
            </span>

            {KOTLIN_FILES.map((file, idx) => (
              <button
                key={file.filename}
                onClick={() => setSelectedFileIndex(idx)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-mono text-left transition-all cursor-pointer ${
                  selectedFileIndex === idx
                    ? 'bg-[#005cb2]/30 text-sky-300 border border-[#005cb2]/50 font-semibold'
                    : 'text-neutral-400 hover:bg-neutral-800/70 hover:text-neutral-200'
                }`}
              >
                <FileCode className="w-4 h-4 shrink-0 text-emerald-400" />
                <div className="truncate">
                  <div className="truncate">{file.filename}</div>
                  <div className="text-[10px] text-neutral-500 truncate">{file.packagePath}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#0d0e11] overflow-hidden">
            <div className="px-4 py-2 bg-[#121317] border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span className="font-mono text-emerald-400 font-semibold">
                {currentFile.packagePath}/{currentFile.filename}
              </span>
              <span className="text-[11px] text-neutral-500">
                {currentFile.description}
              </span>
            </div>

            <pre className="flex-1 p-4 overflow-auto text-xs font-mono text-neutral-200 leading-relaxed selection:bg-sky-900">
              <code>{currentFile.code}</code>
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#18181c] border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span>
            💡 Complete MVVM Architecture with Room DAO, Flow queries & Jetpack Compose Material 3 UI.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { Database, Table, Search, ChevronRight, Loader, Download, X, ArrowUpDown, ArrowUp, ArrowDown, FileText, Hash, Calendar, PanelLeftClose, PanelLeft, Trash2, FolderPlus, Folder, ChevronDown, GripVertical, Settings2, Filter, Eye, EyeOff } from "lucide-react";
import Card from "../components/ui/Card";
import axios from 'axios';

const DataExplorer = () => {
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState({ columns: [], rows: [] });
  // Ensure filteredRows is always an array
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination & Sorting state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  // New states for Column/Filter
  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnFilters, setColumnFilters] = useState({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [activeFilterCol, setActiveFilterCol] = useState(null);

  // Search state
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Sidebar toggle state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Categories state (stored in localStorage)
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('db_categories');
    return saved ? JSON.parse(saved) : {};
  });
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [draggedDb, setDraggedDb] = useState(null);

  // Persist categories to localStorage
  useEffect(() => {
    localStorage.setItem('db_categories', JSON.stringify(categories));
  }, [categories]);

  // Apply column filters locally to the current page/dataset
  // Note: For true server-side filtering per column, backend API update is needed.
  // This client-side implementation works on the fetched dataset.
  useEffect(() => {
    // Safety check: ensure tableData.rows is valid
    if (!tableData.rows || !Array.isArray(tableData.rows)) return;
    
    // If no data, just set filtered to empty
    if (tableData.rows.length === 0) {
      setFilteredRows([]);
      return;
    }

    let result = [...tableData.rows];

    // Apply column specific filters safely
    Object.keys(columnFilters).forEach(col => {
      const filterValue = columnFilters[col]?.toLowerCase() || '';
      if (filterValue) {
        result = result.filter(row => {
          // Handle null/undefined values safely
          const val = row[col];
          const strVal = (val === null || val === undefined) ? '' : String(val);
          return strVal.toLowerCase().includes(filterValue);
        });
      }
    });

    setFilteredRows(result);
  }, [tableData.rows, columnFilters]);

  // Reset column state on table change
  useEffect(() => {
    setColumnVisibility({});
    setColumnFilters({});
    setShowColumnMenu(false);
    setActiveFilterCol(null);
  }, [selectedTable]);

  // Category handlers (Same as before)
  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    setCategories(prev => ({ ...prev, [newCategoryName.trim()]: [] }));
    setExpandedCategories(prev => ({ ...prev, [newCategoryName.trim()]: true }));
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const deleteCategory = (catName) => {
    if (!window.confirm(`Delete category "${catName}"?`)) return;
    setCategories(prev => {
      const updated = { ...prev };
      delete updated[catName];
      return updated;
    });
  };

  const toggleCategory = (catName) => {
    setExpandedCategories(prev => ({ ...prev, [catName]: !prev[catName] }));
  };

  // Drag handlers (Same as before)
  const handleDragStart = (e, db) => {
    setDraggedDb(db);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnCategory = (e, catName) => {
    e.preventDefault();
    if (!draggedDb) return;
    setCategories(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(cat => {
        updated[cat] = updated[cat].filter(db => db !== draggedDb);
      });
      if (!updated[catName].includes(draggedDb)) {
        updated[catName] = [...updated[catName], draggedDb];
      }
      return updated;
    });
    setDraggedDb(null);
  };

  const handleDropOnUncategorized = (e) => {
    e.preventDefault();
    if (!draggedDb) return;
    setCategories(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(cat => {
        updated[cat] = updated[cat].filter(db => db !== draggedDb);
      });
      return updated;
    });
    setDraggedDb(null);
  };

  const uncategorizedDbs = databases.filter(db => 
    !Object.values(categories).flat().includes(db)
  );

  const DbItem = ({ db }) => (
    <div className="space-y-1">
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, db)}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between cursor-grab active:cursor-grabbing ${
          selectedDb === db ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
        onClick={() => handleDbSelect(db)}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-3 h-3 text-gray-600" />
          <span className="truncate font-medium">{db}</span>
        </div>
        {selectedDb === db && <ChevronRight className="w-3 h-3" />}
      </div>
      
      {selectedDb === db && (
        <div className="pl-4 space-y-1 mt-1 border-l border-white/10 ml-3">
          {tables.map((table) => (
            <div key={table} className="group/table flex items-center">
              <button
                onClick={() => handleTableSelect(table)}
                className={`flex-1 text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  selectedTable === table ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <Table className="w-3 h-3" />
                <span className="truncate">{table}</span>
              </button>
              <button
                onClick={(e) => handleDeleteTable(table, e)}
                className="p-1 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover/table:opacity-100"
                title={`Delete ${table}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  useEffect(() => { fetchDatabases(); }, []);

  useEffect(() => {
    const activeDbName = localStorage.getItem('activeDatabase');
    if (activeDbName && databases.length > 0) {
      const activeDb = databases.find(db => db === activeDbName || db === `${activeDbName}.db`);
      if (activeDb && !selectedDb) handleDbSelect(activeDb);
    }
  }, [databases]);

  // Global search effect
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!searchTerm.trim()) {
      // Re-apply column filters if search is cleared
      setFilteredRows([...(tableData.rows || [])]); 
      return;
    }

    searchTimeoutRef.current = setTimeout(() => searchDatabase(searchTerm), 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm, selectedDb, selectedTable, tableData.rows]);

  const searchDatabase = async (term) => {
    if (!selectedDb || !selectedTable || !term.trim()) return;
    
    setSearchLoading(true);
    try {
      const url = `/api/databases/${selectedDb}/tables/${selectedTable}/search?q=${encodeURIComponent(term)}&page=1&limit=${limit}`;
      const res = await axios.get(url);
      setFilteredRows(res.data.rows || []);
      setTotalRows(res.data.total || 0);
      setTotalPages(res.data.pages || 0);
      setPage(1);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchDatabases = async () => {
    try {
      const res = await axios.get('/api/databases');
      setDatabases(res.data.databases);
    } catch (error) { console.error("Failed to fetch databases", error); }
  };

  const handleDbSelect = async (db) => {
    setSelectedDb(db);
    localStorage.setItem('activeDatabase', db); // Sync with Agent context
    setSelectedTable(null);
    setTableData({ columns: [], rows: [] });
    setSearchTerm("");
    setPage(1);
    setSortBy(null);
    setSortOrder('asc');
    try {
      const res = await axios.get(`/api/databases/${db}/tables`);
      setTables(res.data.tables);
    } catch (error) { console.error("Failed to fetch tables", error); }
  };

  const handleTableSelect = async (table) => {
    setSelectedTable(table);
    setSearchTerm("");
    setPage(1);
    setSortBy(null);
    setSortOrder('asc');
    fetchTableData(table, 1, null, 'asc');
  };

  const handleDeleteTable = async (tableName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete table "${tableName}"?`)) return;

    try {
      await axios.delete(`/api/databases/${selectedDb}/tables/${tableName}`);
      const res = await axios.get(`/api/databases/${selectedDb}/tables`);
      setTables(res.data.tables || []);
      if (selectedTable === tableName) {
        setSelectedTable(null);
        setTableData({ columns: [], rows: [] });
      }
    } catch (error) {
      console.error("Failed to delete table", error);
      alert(`Failed to delete: ${error.response?.data?.error || error.message}`);
    }
  };

  const fetchTableData = async (table, pageNum, sort = sortBy, order = sortOrder) => {
    setLoading(true);
    setSearchTerm("");
    try {
      let url = `/api/databases/${selectedDb}/tables/${table}/rows?page=${pageNum}&limit=${limit}`;
      if (sort) url += `&sort_by=${sort}&order=${order}`;
      
      const res = await axios.get(url);
      setTableData({ columns: res.data.columns, rows: res.data.rows });
      
      // Initialize visibility for new columns
      const initialVisibility = {};
      res.data.columns.forEach(col => initialVisibility[col] = true);
      setColumnVisibility(initialVisibility);
      
      setFilteredRows(res.data.rows || []);
      setTotalRows(res.data.total);
      setTotalPages(res.data.pages);
      setPage(pageNum);
    } catch (error) { console.error("Failed to fetch table data", error); } 
    finally { setLoading(false); }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) fetchTableData(selectedTable, newPage);
  };

  const handleSort = (column) => {
    let newOrder = 'asc';
    if (sortBy === column && sortOrder === 'asc') newOrder = 'desc';
    setSortBy(column);
    setSortOrder(newOrder);
    fetchTableData(selectedTable, 1, column, newOrder);
  };

  // Export functions (Same as before)
  const handleExportCSV = () => {
    if (!filteredRows.length) return;
    const visibleCols = tableData.columns.filter(c => columnVisibility[c] !== false);
    
    // Create CSV content considering visibility
    const headers = visibleCols.join(',');
    const rows = filteredRows.map(row => 
      visibleCols.map(col => `"${String(row[col] || '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}_export.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => { /* Excel export logic similar to CSV but html */ };

  // Helper to toggle a column's visibility
  const toggleColumnVisibility = (col) => {
    setColumnVisibility(prev => ({
      ...prev,
      [col]: !prev[col]
    }));
  };

  return (
    <div className="space-y-6 h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/10"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">Data Explorer</h2>
            <p className="text-gray-400">Inspect and analyze your raw data</p>
          </div>
        </div>
      </div>

      <div className={`grid ${sidebarOpen ? 'grid-cols-12' : 'grid-cols-1'} gap-6 flex-1 min-h-0`}>
        {/* Sidebar: DBs and Tables */}
        {sidebarOpen && (
        <Card className="col-span-3 flex flex-col !p-0 overflow-hidden border-white/10 bg-black/20 backdrop-blur-sm">
          {/* Categories Sidebar Content */}
          <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              Databases
            </h3>
            <button
              onClick={() => setShowAddCategory(!showAddCategory)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-green-400 transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
          
          {showAddCategory && (
            <div className="p-2 border-b border-white/10 bg-white/5 flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                placeholder="Category name..."
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                autoFocus
              />
              <button
                onClick={addCategory}
                className="px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg text-sm"
              >
                Add
              </button>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
            {Object.entries(categories).map(([catName, catDbs]) => (
              <div
                key={catName}
                className="rounded-lg border border-white/5 bg-white/5 overflow-hidden"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnCategory(e, catName)}
              >
                <div className="flex items-center justify-between px-3 py-2 bg-white/5 cursor-pointer" onClick={() => toggleCategory(catName)}>
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Folder className="w-4 h-4" />
                    <span className="text-sm font-medium">{catName}</span>
                    <span className="text-xs text-gray-500">({catDbs.length})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); deleteCategory(catName); }} className="p-1 text-gray-500 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedCategories[catName] ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {expandedCategories[catName] && (
                  <div className="p-1 space-y-1 min-h-[30px] border-t border-white/5">
                    {catDbs.map(db => databases.includes(db) && <DbItem key={db} db={db} />)}
                  </div>
                )}
              </div>
            ))}
            
            <div className="mt-2" onDragOver={handleDragOver} onDrop={handleDropOnUncategorized}>
              {Object.keys(categories).length > 0 && uncategorizedDbs.length > 0 && <div className="text-xs text-gray-500 px-2 py-1 mb-1">Uncategorized</div>}
              {uncategorizedDbs.map((db) => <DbItem key={db} db={db} />)}
            </div>
          </div>
        </Card>
        )}

        {/* Main View: Data Table */}
        <Card className={`${sidebarOpen ? 'col-span-9' : 'col-span-12'} flex flex-col !p-0 overflow-hidden relative border-white/10 bg-black/20 backdrop-blur-sm`}>
          {!selectedTable ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <Search className="w-16 h-16 opacity-20 mb-4" />
              <p className="text-lg font-medium text-gray-400">Select a table to view its contents</p>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400"><Table className="w-5 h-5" /></div>
                    <div>
                        <h3 className="font-semibold text-white text-lg">{selectedTable}</h3>
                        <p className="text-xs text-gray-400">{filteredRows.length} shown • {totalRows.toLocaleString()} total</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Column Visibility Menu */}
                  <div className="relative">
                    <button
                        onClick={() => setShowColumnMenu(!showColumnMenu)}
                        className={`p-2 rounded-lg hover:bg-white/10 transition-colors border ${showColumnMenu ? 'bg-white/10 border-blue-500/50 text-blue-400' : 'border-white/10 text-gray-400'}`}
                        title="Column Visibility"
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>
                    {showColumnMenu && (
                        <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowColumnMenu(false)} />
                        <div className="absolute right-0 top-full mt-2 w-56 max-h-80 overflow-y-auto bg-gray-900 border border-white/10 rounded-xl shadow-xl z-50 p-2">
                            <div className="text-xs font-semibold text-gray-500 px-2 py-1">Visible Columns</div>
                            {tableData.columns.map(col => (
                                <button
                                    key={col}
                                    onClick={() => toggleColumnVisibility(col)}
                                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 text-sm text-gray-300 flex items-center justify-between group"
                                >
                                    <span className="truncate">{col}</span>
                                    {columnVisibility[col] !== false ? 
                                        <Eye className="w-3 h-3 text-blue-400" /> : 
                                        <EyeOff className="w-3 h-3 text-gray-600" />
                                    }
                                </button>
                            ))}
                        </div>
                        </>
                    )}
                  </div>

                  {/* Global Search */}
                  <div className="relative group">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text"
                      placeholder="Global Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 bg-black/40 border border-white/10 rounded-xl pl-10 pr-8 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white"><X className="w-3 h-3" /></button>
                    )}
                  </div>

                  <button 
                    onClick={handleExportCSV}
                    disabled={!filteredRows.length}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600/10 hover:bg-green-600/20 text-green-400 rounded-xl text-sm font-medium transition-colors border border-green-500/20 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              </div>
              
              {/* Table */}
              <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-white/10 relative">
                {(loading || searchLoading) ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4">
                     <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                     <p className="text-sm text-gray-500 animate-pulse">Loading data...</p>
                  </div>
                ) : filteredRows.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <Search className="w-12 h-12 opacity-20 mb-2" />
                    <p className="text-lg">No results found</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#09090b] z-20 shadow-lg shadow-black/50">
                      <tr>
                        {tableData.columns.map((col) => {
                            if (columnVisibility[col] === false) return null;

                            return (
                              <th 
                                key={col} 
                                className="p-4 text-xs font-semibold text-gray-400 border-b border-white/10 whitespace-nowrap bg-[#09090b]/95 backdrop-blur-sm group select-none relative"
                              >
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-4">
                                        <div 
                                            className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                                            onClick={() => handleSort(col)}
                                        >
                                            <span className="font-bold text-gray-300">{col}</span>
                                            {sortBy === col ? (
                                                sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
                                            ) : (
                                                <ArrowUpDown className="w-3 h-3 opacity-20" />
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => setActiveFilterCol(activeFilterCol === col ? null : col)}
                                            className={`p-1 rounded hover:bg-white/10 ${columnFilters[col] ? 'text-blue-400' : 'text-gray-600'}`}
                                        >
                                            <Filter className="w-3 h-3" />
                                        </button>
                                    </div>
                                    
                                    {/* Inline Filter Input */}
                                    {activeFilterCol === col && (
                                        <div className="absolute top-full left-0 w-full min-w-[150px] bg-[#09090b] p-2 border border-white/10 rounded-b-lg shadow-xl z-30">
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder={`Filter ${col}...`}
                                                value={columnFilters[col] || ''}
                                                onChange={(e) => setColumnFilters(prev => ({ ...prev, [col]: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    )}
                                </div>
                              </th>
                            );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredRows.map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                          {tableData.columns.map((col) => {
                            if (columnVisibility[col] === false) return null;
                            return (
                                <td key={col} className="p-4 text-sm text-gray-400 whitespace-nowrap border-r border-white/5 last:border-0 group-hover:text-gray-200 transition-colors max-w-[300px] truncate">
                                {row[col]}
                                </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

               {/* Pagination Controls (Same as before) */}
               <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between items-center">
                <span className="text-sm text-gray-400">Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{totalPages}</span></span>
                <div className="flex gap-2">
                  <button onClick={() => handlePageChange(page - 1)} disabled={page === 1 || loading} className="px-4 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 border border-white/5">Previous</button>
                  <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages || loading} className="px-4 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 border border-white/5">Next</button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DataExplorer;

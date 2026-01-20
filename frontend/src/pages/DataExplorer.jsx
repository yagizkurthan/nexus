import { useState, useEffect, useRef } from "react";
import { Database, Table, Search, ChevronRight, Loader, Download, X, ArrowUpDown, ArrowUp, ArrowDown, FileText, Hash, Calendar, PanelLeftClose, PanelLeft } from "lucide-react";
import Card from "../components/ui/Card";
import axios from 'axios';

const DataExplorer = () => {
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState({ columns: [], rows: [] });
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

  // Search state
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Sidebar toggle state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchDatabases();
  }, []);

  // Auto-load active database from localStorage
  useEffect(() => {
    const activeDbName = localStorage.getItem('activeDatabase');
    if (activeDbName && databases.length > 0) {
      // Find and select the active database
      const activeDb = databases.find(db => db === activeDbName || db === `${activeDbName}.db`);
      if (activeDb && !selectedDb) {
        handleDbSelect(activeDb);
      }
    }
  }, [databases]);

  // Debounced database-wide search
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If no search term, show all table data
    if (!searchTerm.trim()) {
      setFilteredRows(tableData.rows);
      return;
    }

    // Debounce search by 300ms
    searchTimeoutRef.current = setTimeout(() => {
      searchDatabase(searchTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, selectedDb, selectedTable, tableData.rows]);

  // Search entire database via API
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
      setFilteredRows([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchDatabases = async () => {
    try {
      const res = await axios.get('/api/databases');
      setDatabases(res.data.databases);
    } catch (error) {
      console.error("Failed to fetch databases", error);
    }
  };

  const handleDbSelect = async (db) => {
    setSelectedDb(db);
    setSelectedTable(null);
    setTableData({ columns: [], rows: [] });
    setSearchTerm("");
    setPage(1);
    setSortBy(null);
    setSortOrder('asc');
    try {
      const res = await axios.get(`/api/databases/${db}/tables`);
      setTables(res.data.tables);
    } catch (error) {
      console.error("Failed to fetch tables", error);
    }
  };

  const handleTableSelect = async (table) => {
    setSelectedTable(table);
    setPage(1); // Reset to first page
    setSortBy(null);
    setSortOrder('asc');
    fetchTableData(table, 1, null, 'asc');
  };

  const fetchTableData = async (table, pageNum, sort = sortBy, order = sortOrder) => {
    setLoading(true);
    setSearchTerm("");
    try {
      let url = `/api/databases/${selectedDb}/tables/${table}/rows?page=${pageNum}&limit=${limit}`;
      if (sort) {
        url += `&sort_by=${sort}&order=${order}`;
      }
      
      const res = await axios.get(url);
      setTableData({
        columns: res.data.columns,
        rows: res.data.rows
      });
      setTotalRows(res.data.total);
      setTotalPages(res.data.pages);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch table data", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchTableData(selectedTable, newPage);
    }
  };

  const handleSort = (column) => {
    let newOrder = 'asc';
    if (sortBy === column && sortOrder === 'asc') {
      newOrder = 'desc';
    }
    setSortBy(column);
    setSortOrder(newOrder);
    fetchTableData(selectedTable, 1, column, newOrder);
  };

  const handleExport = () => {
    if (!filteredRows.length) return;
    
    // Create CSV content
    const headers = tableData.columns.join(',');
    const rows = filteredRows.map(row => 
      tableData.columns.map(col => `"${row[col] || ''}"`).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}_export.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/10"
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
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
          <div className="p-4 border-b border-white/10 bg-white/5">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              Databases
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
            {databases.map((db) => (
              <div key={db} className="space-y-1">
                <button
                  onClick={() => handleDbSelect(db)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                    selectedDb === db ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="truncate font-medium">{db}</span>
                  {selectedDb === db && <ChevronRight className="w-3 h-3" />}
                </button>
                
                {selectedDb === db && (
                  <div className="pl-4 space-y-1 mt-1 border-l border-white/10 ml-3">
                    {tables.map((table) => (
                      <button
                        key={table}
                        onClick={() => handleTableSelect(table)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                          selectedTable === table ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <Table className="w-3 h-3" />
                        <span className="truncate">{table}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
        )}

        {/* Main View: Data Table */}
        <Card className={`${sidebarOpen ? 'col-span-9' : 'col-span-12'} flex flex-col !p-0 overflow-hidden relative border-white/10 bg-black/20 backdrop-blur-sm`}>
          {!selectedTable ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-lg font-medium text-gray-400">Select a table to view its contents</p>
              <p className="text-sm text-gray-600">Choose a database and table from the sidebar</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                        <Table className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-lg">
                        {selectedTable}
                        </h3>
                        <p className="text-xs text-gray-400">
                            {totalRows.toLocaleString()} total rows • {tableData.columns.length} columns
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Search Input */}
                  <div className="relative group">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                    <input 
                      type="text"
                      placeholder="Search in database..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 bg-black/40 border border-white/10 rounded-xl pl-10 pr-8 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-gray-600"
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  {/* Export Button */}
                  <button 
                    onClick={handleExport}
                    disabled={!filteredRows.length}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600/10 hover:bg-green-600/20 text-green-400 rounded-xl text-sm font-medium transition-colors border border-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-white/10 relative">
                {(loading || searchLoading) ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4">
                    <div className="flex gap-1 items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}/>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}/>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}/>
                    </div>
                    <p className="text-sm text-gray-500 animate-pulse font-medium">
                      {searchLoading ? 'Searching database...' : `Fetching ${limit} rows...`}
                    </p>
                  </div>
                ) : filteredRows.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                        <Search className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-lg font-medium text-gray-400">No results found</p>
                    <p className="text-sm text-gray-600">Try adjusting your search query</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#09090b] z-20 shadow-lg shadow-black/50">
                      <tr>
                        {tableData.columns.map((col) => {
                            // Heuristic for type icon
                            const firstVal = tableData.rows[0]?.[col];
                            let TypeIcon = FileText; // Default text
                            if (typeof firstVal === 'number') TypeIcon = Hash;
                            if (String(firstVal).includes('-') && String(firstVal).includes(':')) TypeIcon = Calendar;

                            return (
                              <th 
                                key={col} 
                                onClick={() => handleSort(col)}
                                className="p-4 text-xs font-semibold text-gray-400 border-b border-white/10 whitespace-nowrap bg-[#09090b]/95 backdrop-blur-sm hover:bg-white/5 cursor-pointer transition-colors group select-none relative"
                              >
                                <div className="flex items-center gap-2">
                                    <TypeIcon className="w-3 h-3 text-gray-600" />
                                    <span className="group-hover:text-white transition-colors">{col}</span>
                                    {sortBy === col ? (
                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
                                    ) : (
                                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-30 transition-opacity" />
                                    )}
                                </div>
                                {/* Resize handle (visual only for now) */}
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-4 bg-white/10 group-hover:bg-white/20" />
                              </th>
                            );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredRows.map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                          {tableData.columns.map((col) => (
                            <td key={col} className="p-4 text-sm text-gray-400 whitespace-nowrap border-r border-white/5 last:border-0 group-hover:text-gray-200 transition-colors max-w-[300px] truncate">
                              {row[col]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Controls */}
              <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{totalPages}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1 || loading}
                    className="px-4 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/5"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages || loading}
                    className="px-4 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/5"
                  >
                    Next
                  </button>
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

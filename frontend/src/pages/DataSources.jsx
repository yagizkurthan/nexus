import { useState, useEffect, useRef } from "react";
import { Database, Plus, RefreshCw, Upload, Search, Eye, CheckCircle2, AlertCircle, Check } from "lucide-react";
import Card from "../components/ui/Card";
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const DataSources = ({ onNavigate }) => {
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeDb, setActiveDb] = useState(localStorage.getItem('activeDatabase') || null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/databases');
      const dbs = res.data.databases.map(name => {
        // Clean up database name for display (remove .db if present)
        const displayName = name.replace('.db', '');
        return {
          id: name,
          name: displayName,
          type: 'File Upload',
          status: 'Connected',
          lastSync: 'Just now'
        };
      });
      setDatabases(dbs);

      // Auto-select first database if none selected
      if (!activeDb && dbs.length > 0) {
        handleSetActive(dbs[0].name);
      }
    } catch (error) {
      console.error("Failed to fetch databases", error);
      toast.error('Failed to load databases');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = (dbName) => {
    setActiveDb(dbName);
    localStorage.setItem('activeDatabase', dbName);
    toast.success(`Using "${dbName}" for agent queries`);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    // Use the CSV filename (without extension) as the database name
    const dbName = file.name.split('.')[0];

    const formData = new FormData();
    formData.append('file', file);
    formData.append('db_name', dbName);
    formData.append('table_name', 'data'); // Standard table name

    const uploadToast = toast.loading(`Uploading ${file.name}...`);

    try {
      setUploading(true);
      const response = await axios.post('/api/upload_csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Refresh database list
      await fetchDatabases();

      const { rows, columns, table, message } = response.data;

      // Auto-select uploaded database
      handleSetActive(dbName);

      toast.success(
        <div className="text-sm">
          <div className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Upload Successful!
          </div>
          <div className="text-gray-600 mt-1">
            {rows} rows, {columns} columns
          </div>
          <div className="text-gray-500 text-xs mt-1">
            Database "{dbName}" set as active
          </div>
        </div>,
        { id: uploadToast, duration: 5000 }
      );
    } catch (error) {
      console.error("Upload failed", error);
      const errorMsg = error.response?.data?.error || error.message;

      toast.error(
        <div className="text-sm">
          <div className="font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Upload Failed
          </div>
          <div className="text-gray-600 mt-1 max-w-xs truncate">
            {errorMsg}
          </div>
        </div>,
        { id: uploadToast, duration: 6000 }
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '12px 16px'
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' }
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' }
          }
        }}
      />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Data Sources</h2>
          <p className="text-gray-400">Manage your connected databases and files</p>
          {activeDb && (
            <p className="text-sm text-blue-400 mt-1 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Active: {activeDb}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv, .xlsx, .xls"
            className="hidden"
            disabled={uploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Data
              </>
            )}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Connect Database
          </button>
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search sources..."
              className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <button
            onClick={fetchDatabases}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-white/10">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Last Sync</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {databases.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">
                  {loading ? 'Loading databases...' : 'No data sources connected. Upload a CSV or Excel file to get started.'}
                </td>
              </tr>
            ) : (
              databases.map((db) => (
                <tr
                  key={db.id}
                  className={`group hover:bg-white/5 transition-colors ${activeDb === db.name ? 'bg-blue-500/10' : ''
                    }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${activeDb === db.name
                          ? 'bg-blue-500/30 text-blue-300'
                          : 'bg-blue-500/20 text-blue-400'
                        }`}>
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{db.name}</span>
                          {activeDb === db.name && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              ACTIVE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400">{db.type}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {db.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">{db.lastSync}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {activeDb !== db.name && (
                        <button
                          onClick={() => handleSetActive(db.name)}
                          className="px-3 py-1 text-xs rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          Set Active
                        </button>
                      )}
                      <button
                        onClick={() => onNavigate && onNavigate('data-explorer')}
                        className="p-2 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        title="Inspect Data"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default DataSources;

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AnalysisContext = createContext();

export const useAnalysis = () => {
    const context = useContext(AnalysisContext);
    if (!context) {
        throw new Error('useAnalysis must be used within an AnalysisProvider');
    }
    return context;
};

export const AnalysisProvider = ({ children }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);
    const [activeDb, setActiveDb] = useState(localStorage.getItem('activeDatabase'));

    // Sync activeDb with localStorage changes (optional, but good for consistency)
    useEffect(() => {
        const handleStorageChange = () => {
             setActiveDb(localStorage.getItem('activeDatabase'));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Also check on mount
    useEffect(() => {
         setActiveDb(localStorage.getItem('activeDatabase'));
    }, []);

    const generateReport = async (dbName, model) => {
        if (!dbName) {
            toast.error("No database selected");
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        // Don't clear report immediately if you want to show old one while loading, 
        // but usually better to clear to show valid loading state.
        // setReport(null); 

        try {
            const res = await axios.post('/api/generate_report', {
                database: dbName,
                model: model
            });
            setReport(res.data);
            toast.success("Analysis complete!");
        } catch (err) {
            console.error("Analysis failed", err);
            let errMsg = "Failed to generate report.";
            if (err.response && err.response.status === 429) {
                errMsg = "AI usage limit exceeded. Please try again later.";
            } else if (err.response && err.response.data && err.response.data.error) {
                errMsg = err.response.data.error;
            }
            setError(errMsg);
            toast.error(errMsg);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const clearReport = () => {
        setReport(null);
        setError(null);
    };

    const value = {
        isAnalyzing,
        report,
        error,
        generateReport,
        clearReport,
        activeDb, 
        setActiveDb // Allow components to update if needed, though usually done via DataSources
    };

    return (
        <AnalysisContext.Provider value={value}>
            {children}
        </AnalysisContext.Provider>
    );
};

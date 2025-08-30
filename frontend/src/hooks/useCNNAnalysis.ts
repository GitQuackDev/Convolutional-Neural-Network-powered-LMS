import { useState, useCallback } from 'react';
import type { CNNAnalysisResult, UploadedFile } from '@/types/upload';

export const useCNNAnalysis = () => {
  const [analysisResults, setAnalysisResults] = useState<Map<string, CNNAnalysisResult>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState<Set<string>>(new Set());

  const generateMockAnalysis = useCallback((uploadId: string): CNNAnalysisResult => {
    return {
      uploadId,
      status: 'completed',
      analysis: {
        objectDetection: [
          {
            label: 'Laptop Computer',
            confidence: 0.94,
            boundingBox: { x: 120, y: 80, width: 300, height: 200 }
          },
          {
            label: 'USB Cable',
            confidence: 0.87,
            boundingBox: { x: 50, y: 220, width: 150, height: 30 }
          },
          {
            label: 'Smartphone',
            confidence: 0.91,
            boundingBox: { x: 350, y: 150, width: 80, height: 160 }
          }
        ],
        categorization: [
          {
            category: 'Information Technology',
            confidence: 0.95,
            subcategories: ['Hardware', 'Mobile Devices', 'Computing Equipment']
          },
          {
            category: 'Educational Technology',
            confidence: 0.89,
            subcategories: ['E-Learning Tools', 'Digital Devices']
          }
        ],
        hardwareIdentification: [
          {
            component: 'MacBook Pro 13-inch',
            specifications: {
              processor: 'M2 Chip',
              memory: '16GB RAM',
              storage: '512GB SSD',
              display: '13.3-inch Retina'
            },
            compatibility: ['macOS Ventura', 'USB-C', 'Thunderbolt 4']
          },
          {
            component: 'iPhone 14',
            specifications: {
              processor: 'A15 Bionic',
              storage: '128GB',
              camera: '12MP Dual System',
              connectivity: '5G'
            },
            compatibility: ['iOS 16', 'Lightning', 'Wireless Charging']
          }
        ],
        wikipediaData: {
          articles: [
            {
              title: 'Laptop Computer',
              excerpt: 'A laptop computer or notebook computer, also known as a laptop or notebook for short, is a small, portable personal computer. Laptops typically have a clamshell form factor with a flat panel screen on the inside of the upper lid and an alphanumeric keyboard on the inside of the lower lid.',
              url: 'https://en.wikipedia.org/wiki/Laptop',
              relevanceScore: 0.94
            },
            {
              title: 'Smartphone',
              excerpt: 'A smartphone is a portable computer device that combines mobile telephone functions and computing functions into one unit. They are distinguished from older-design feature phones by their stronger hardware capabilities and extensive mobile operating systems.',
              url: 'https://en.wikipedia.org/wiki/Smartphone',
              relevanceScore: 0.91
            },
            {
              title: 'Educational Technology',
              excerpt: 'Educational technology is the combined use of computer hardware, software, and educational theory and practice to facilitate learning. When referred to with its abbreviation, EdTech, it often refers to the industry of companies that create educational technology.',
              url: 'https://en.wikipedia.org/wiki/Educational_technology',
              relevanceScore: 0.87
            }
          ]
        }
      },
      processingTime: 8.5,
      timestamp: new Date().toISOString()
    };
  }, []);

  const startAnalysis = useCallback(async (file: UploadedFile): Promise<CNNAnalysisResult> => {
    setIsAnalyzing(prev => new Set(prev).add(file.id));

    // Simulate 10-second CNN analysis
    await new Promise(resolve => setTimeout(resolve, 10000));

    const result = generateMockAnalysis(file.id);
    
    setAnalysisResults(prev => new Map(prev).set(file.id, result));
    setIsAnalyzing(prev => {
      const next = new Set(prev);
      next.delete(file.id);
      return next;
    });

    return result;
  }, [generateMockAnalysis]);

  const getAnalysisResult = useCallback((fileId: string): CNNAnalysisResult | undefined => {
    return analysisResults.get(fileId);
  }, [analysisResults]);

  const isFileAnalyzing = useCallback((fileId: string): boolean => {
    return isAnalyzing.has(fileId);
  }, [isAnalyzing]);

  const clearAnalysis = useCallback((fileId?: string) => {
    if (fileId) {
      setAnalysisResults(prev => {
        const next = new Map(prev);
        next.delete(fileId);
        return next;
      });
      setIsAnalyzing(prev => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    } else {
      setAnalysisResults(new Map());
      setIsAnalyzing(new Set());
    }
  }, []);

  return {
    startAnalysis,
    getAnalysisResult,
    isFileAnalyzing,
    clearAnalysis,
    analysisResults: Array.from(analysisResults.values()),
    analyzingCount: isAnalyzing.size
  };
};
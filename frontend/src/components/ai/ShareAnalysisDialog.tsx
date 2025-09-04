/**
 * Share Analysis Dialog Component
 * Story 2.6: AI Progress Tracking and Results Display Enhancement
 * Task 2.6.4: Export and Sharing Implementation
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Share2,
  Link,
  Copy,
  Mail,
  Users,
  Globe,
  Lock,
  Eye,
  CheckCircle2,
  X,
  Settings,
  Download
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import { cn } from '@/lib/utils';

// Sharing configuration interfaces
export interface ShareConfiguration {
  method: 'link' | 'email' | 'export';
  access: 'public' | 'restricted' | 'private';
  permissions: SharePermission[];
  expiration?: Date;
  requireAuth: boolean;
  allowDownload: boolean;
  allowComments: boolean;
  password?: string;
  notifyOnAccess: boolean;
  
  // Link sharing options
  linkOptions?: {
    customUrl?: string;
    embedEnabled: boolean;
    trackViews: boolean;
    maxViews?: number;
  };
  
  // Email sharing options
  emailOptions?: {
    recipients: string[];
    subject: string;
    message: string;
    sendCopy: boolean;
  };
  
  // Export sharing options
  exportOptions?: {
    format: 'pdf' | 'json' | 'csv' | 'html';
    includeData: boolean;
    includeVisuals: boolean;
  };
}

export interface SharePermission {
  type: 'view' | 'comment' | 'download' | 'edit';
  enabled: boolean;
}

interface ShareRecord {
  id: string;
  analysisId: string;
  configuration: ShareConfiguration;
  shareUrl?: string;
  accessCount: number;
  lastAccessed?: Date;
  createdAt: Date;
  status: 'active' | 'expired' | 'revoked';
}

interface ShareAnalysisDialogProps {
  analysisId: string;
  analysisTitle: string;
  trigger?: React.ReactNode;
  onShareCreated?: (shareRecord: ShareRecord) => void;
  onShareRevoked?: (shareId: string) => void;
  className?: string;
}

// Quick share methods component
const QuickShareMethods: React.FC<{
  onMethodSelect: (method: ShareConfiguration['method']) => void;
  className?: string;
}> = ({ onMethodSelect, className }) => {
  const methods = [
    {
      id: 'link' as const,
      icon: Link,
      title: 'Share Link',
      description: 'Generate a shareable link with access controls',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      id: 'email' as const,
      icon: Mail,
      title: 'Email Share',
      description: 'Send analysis directly via email with attachments',
      color: 'text-green-600 bg-green-100'
    },
    {
      id: 'export' as const,
      icon: Download,
      title: 'Export & Share',
      description: 'Export in multiple formats for external sharing',
      color: 'text-purple-600 bg-purple-100'
    }
  ];

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {methods.map(method => {
        const Icon = method.icon;
        return (
          <motion.div
            key={method.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
            onClick={() => onMethodSelect(method.id)}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className={cn("p-2 rounded-lg", method.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-gray-900">{method.title}</h3>
            </div>
            <p className="text-sm text-gray-600">{method.description}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

// Link sharing configuration component
const LinkSharingConfig: React.FC<{
  configuration: ShareConfiguration;
  onChange: (config: Partial<ShareConfiguration>) => void;
}> = ({ configuration, onChange }) => {
  const [customUrl, setCustomUrl] = useState(configuration.linkOptions?.customUrl || '');

  const handleAccessChange = (access: ShareConfiguration['access']) => {
    onChange({ access });
  };

  const handlePermissionChange = (type: SharePermission['type'], enabled: boolean) => {
    const permissions = configuration.permissions.map(p =>
      p.type === type ? { ...p, enabled } : p
    );
    onChange({ permissions });
  };

  return (
    <div className="space-y-6">
      {/* Access Level */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Access Level</Label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { value: 'public' as const, label: 'Public', description: 'Anyone with the link can access', icon: Globe },
            { value: 'restricted' as const, label: 'Restricted', description: 'Only specified users can access', icon: Users },
            { value: 'private' as const, label: 'Private', description: 'Requires authentication', icon: Lock }
          ].map(option => {
            const Icon = option.icon;
            return (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.01 }}
                className={cn(
                  "p-3 border-2 rounded-lg cursor-pointer transition-colors",
                  configuration.access === option.value 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => handleAccessChange(option.value)}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4 text-gray-600" />
                  <div className="flex-1">
                    <h4 className="font-medium">{option.label}</h4>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  {configuration.access === option.value && (
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Permissions */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Permissions</Label>
        <div className="space-y-3">
          {configuration.permissions.map(permission => (
            <div key={permission.type} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {permission.type === 'view' && <Eye className="h-4 w-4 text-gray-600" />}
                {permission.type === 'comment' && <Users className="h-4 w-4 text-gray-600" />}
                {permission.type === 'download' && <Download className="h-4 w-4 text-gray-600" />}
                {permission.type === 'edit' && <Settings className="h-4 w-4 text-gray-600" />}
                <Label className="text-sm font-medium capitalize">{permission.type}</Label>
              </div>
              <Switch
                checked={permission.enabled}
                onCheckedChange={(checked) => handlePermissionChange(permission.type, checked)}
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Advanced Options */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Advanced Options</Label>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Require Authentication</Label>
              <p className="text-xs text-gray-600">Users must log in to access</p>
            </div>
            <Switch
              checked={configuration.requireAuth}
              onCheckedChange={(checked) => onChange({ requireAuth: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Track Views</Label>
              <p className="text-xs text-gray-600">Monitor who accesses the analysis</p>
            </div>
            <Switch
              checked={configuration.linkOptions?.trackViews || false}
              onCheckedChange={(checked) => onChange({
                linkOptions: { 
                  ...configuration.linkOptions, 
                  trackViews: checked,
                  embedEnabled: configuration.linkOptions?.embedEnabled ?? false
                }
              })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Embedding</Label>
              <p className="text-xs text-gray-600">Allow embedding in other websites</p>
            </div>
            <Switch
              checked={configuration.linkOptions?.embedEnabled || false}
              onCheckedChange={(checked) => onChange({
                linkOptions: { 
                  ...configuration.linkOptions, 
                  embedEnabled: checked,
                  trackViews: configuration.linkOptions?.trackViews ?? false
                }
              })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Notify on Access</Label>
              <p className="text-xs text-gray-600">Get email notifications when accessed</p>
            </div>
            <Switch
              checked={configuration.notifyOnAccess}
              onCheckedChange={(checked) => onChange({ notifyOnAccess: checked })}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Expiration */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Link Expiration</Label>
        <Select
          value={configuration.expiration ? 'custom' : 'never'}
          onValueChange={(value) => {
            if (value === 'never') {
              onChange({ expiration: undefined });
            } else if (value === '7days') {
              const expiration = new Date();
              expiration.setDate(expiration.getDate() + 7);
              onChange({ expiration });
            } else if (value === '30days') {
              const expiration = new Date();
              expiration.setDate(expiration.getDate() + 30);
              onChange({ expiration });
            } else if (value === '90days') {
              const expiration = new Date();
              expiration.setDate(expiration.getDate() + 90);
              onChange({ expiration });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select expiration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never">Never expires</SelectItem>
            <SelectItem value="7days">7 days</SelectItem>
            <SelectItem value="30days">30 days</SelectItem>
            <SelectItem value="90days">90 days</SelectItem>
            <SelectItem value="custom">Custom date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom URL */}
      <div>
        <Label htmlFor="customUrl" className="text-sm font-medium">Custom URL (Optional)</Label>
        <div className="mt-1 flex">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
            /share/
          </span>
          <Input
            id="customUrl"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="my-analysis"
            className="rounded-l-none"
          />
        </div>
        <p className="text-xs text-gray-600 mt-1">Leave empty for auto-generated URL</p>
      </div>
    </div>
  );
};

// Email sharing configuration component
const EmailSharingConfig: React.FC<{
  configuration: ShareConfiguration;
  onChange: (config: Partial<ShareConfiguration>) => void;
}> = ({ configuration, onChange }) => {
  const [recipients, setRecipients] = useState(
    configuration.emailOptions?.recipients.join(', ') || ''
  );

  const handleRecipientsChange = (value: string) => {
    setRecipients(value);
    const emailArray = value.split(',').map(email => email.trim()).filter(Boolean);
    onChange({
      emailOptions: {
        ...configuration.emailOptions,
        recipients: emailArray,
        subject: configuration.emailOptions?.subject || '',
        message: configuration.emailOptions?.message || '',
        sendCopy: configuration.emailOptions?.sendCopy || false
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Recipients */}
      <div>
        <Label htmlFor="recipients" className="text-sm font-medium">Recipients</Label>
        <Textarea
          id="recipients"
          value={recipients}
          onChange={(e) => handleRecipientsChange(e.target.value)}
          placeholder="email1@example.com, email2@example.com"
          className="mt-1"
          rows={3}
        />
        <p className="text-xs text-gray-600 mt-1">Separate multiple emails with commas</p>
      </div>

      {/* Subject */}
      <div>
        <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
        <Input
          id="subject"
          value={configuration.emailOptions?.subject || ''}
          onChange={(e) => onChange({
            emailOptions: {
              ...configuration.emailOptions,
              subject: e.target.value,
              recipients: configuration.emailOptions?.recipients || [],
              message: configuration.emailOptions?.message || '',
              sendCopy: configuration.emailOptions?.sendCopy || false
            }
          })}
          placeholder="Analysis Results: [Analysis Title]"
          className="mt-1"
        />
      </div>

      {/* Message */}
      <div>
        <Label htmlFor="message" className="text-sm font-medium">Message</Label>
        <Textarea
          id="message"
          value={configuration.emailOptions?.message || ''}
          onChange={(e) => onChange({
            emailOptions: {
              ...configuration.emailOptions,
              message: e.target.value,
              recipients: configuration.emailOptions?.recipients || [],
              subject: configuration.emailOptions?.subject || '',
              sendCopy: configuration.emailOptions?.sendCopy || false
            }
          })}
          placeholder="I'm sharing the analysis results with you. Please find the detailed report attached."
          className="mt-1"
          rows={4}
        />
      </div>

      <Separator />

      {/* Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Send copy to myself</Label>
            <p className="text-xs text-gray-600">Receive a copy of the email</p>
          </div>
          <Switch
            checked={configuration.emailOptions?.sendCopy || false}
            onCheckedChange={(checked) => onChange({
              emailOptions: {
                ...configuration.emailOptions,
                sendCopy: checked,
                recipients: configuration.emailOptions?.recipients || [],
                subject: configuration.emailOptions?.subject || '',
                message: configuration.emailOptions?.message || ''
              }
            })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Include download link</Label>
            <p className="text-xs text-gray-600">Add secure download link in email</p>
          </div>
          <Switch
            checked={configuration.allowDownload}
            onCheckedChange={(checked) => onChange({ allowDownload: checked })}
          />
        </div>
      </div>
    </div>
  );
};

// Export sharing configuration component
const ExportSharingConfig: React.FC<{
  configuration: ShareConfiguration;
  onChange: (config: Partial<ShareConfiguration>) => void;
}> = ({ configuration, onChange }) => {
  return (
    <div className="space-y-6">
      {/* Export Format */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Export Format</Label>
        <Select
          value={configuration.exportOptions?.format || 'pdf'}
          onValueChange={(value: 'pdf' | 'json' | 'csv' | 'html') => onChange({
            exportOptions: {
              format: value,
              includeData: configuration.exportOptions?.includeData || true,
              includeVisuals: configuration.exportOptions?.includeVisuals || true
            }
          })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pdf">PDF Report</SelectItem>
            <SelectItem value="json">JSON Data</SelectItem>
            <SelectItem value="csv">CSV Spreadsheet</SelectItem>
            <SelectItem value="html">HTML Report</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Export Options */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Export Options</Label>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Include Data</Label>
              <p className="text-xs text-gray-600">Include raw analysis data</p>
            </div>
            <Switch
              checked={configuration.exportOptions?.includeData !== false}
              onCheckedChange={(checked) => onChange({
                exportOptions: {
                  ...configuration.exportOptions,
                  includeData: checked,
                  format: configuration.exportOptions?.format || 'pdf',
                  includeVisuals: configuration.exportOptions?.includeVisuals || true
                }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Include Visuals</Label>
              <p className="text-xs text-gray-600">Include charts and visualizations</p>
            </div>
            <Switch
              checked={configuration.exportOptions?.includeVisuals !== false}
              onCheckedChange={(checked) => onChange({
                exportOptions: {
                  ...configuration.exportOptions,
                  includeVisuals: checked,
                  format: configuration.exportOptions?.format || 'pdf',
                  includeData: configuration.exportOptions?.includeData || true
                }
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Active shares list component
const ActiveSharesList: React.FC<{
  shares: ShareRecord[];
  onRevoke: (shareId: string) => void;
  onCopyLink: (shareUrl: string) => void;
}> = ({ shares, onRevoke, onCopyLink }) => {
  if (shares.length === 0) {
    return (
      <div className="text-center py-8">
        <Share2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">No active shares</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {shares.map(share => (
        <Card key={share.id} className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Badge variant={share.status === 'active' ? 'default' : 'secondary'}>
                {share.status}
              </Badge>
              <span className="text-sm font-medium capitalize">{share.configuration.method}</span>
              <span className="text-xs text-gray-600">•</span>
              <span className="text-xs text-gray-600 capitalize">{share.configuration.access}</span>
            </div>
            <div className="flex items-center space-x-1">
              {share.shareUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopyLink(share.shareUrl!)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRevoke(share.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-gray-600 space-y-1">
            <div>Created: {share.createdAt.toLocaleDateString()}</div>
            <div>Views: {share.accessCount}</div>
            {share.lastAccessed && (
              <div>Last accessed: {share.lastAccessed.toLocaleDateString()}</div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

// Main Share Analysis Dialog component
export const ShareAnalysisDialog: React.FC<ShareAnalysisDialogProps> = ({
  analysisId,
  analysisTitle,
  trigger,
  onShareCreated,
  onShareRevoked,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<ShareConfiguration['method']>('link');
  const [configuration, setConfiguration] = useState<ShareConfiguration>({
    method: 'link',
    access: 'restricted',
    permissions: [
      { type: 'view', enabled: true },
      { type: 'comment', enabled: false },
      { type: 'download', enabled: false },
      { type: 'edit', enabled: false }
    ],
    requireAuth: false,
    allowDownload: false,
    allowComments: false,
    notifyOnAccess: false,
    linkOptions: {
      embedEnabled: false,
      trackViews: true
    },
    emailOptions: {
      recipients: [],
      subject: `Analysis Results: ${analysisTitle}`,
      message: '',
      sendCopy: false
    },
    exportOptions: {
      format: 'pdf',
      includeData: true,
      includeVisuals: true
    }
  });
  
  const [activeShares, setActiveShares] = useState<ShareRecord[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleConfigurationChange = useCallback((updates: Partial<ShareConfiguration>) => {
    setConfiguration(prev => ({ ...prev, ...updates }));
  }, []);

  const handleMethodSelect = useCallback((method: ShareConfiguration['method']) => {
    setSelectedMethod(method);
    setConfiguration(prev => ({ ...prev, method }));
  }, []);

  const handleCreateShare = useCallback(async () => {
    setIsCreating(true);
    
    try {
      // Simulate share creation
      const newShare: ShareRecord = {
        id: `share_${Date.now()}`,
        analysisId,
        configuration,
        shareUrl: configuration.method === 'link' 
          ? `https://example.com/share/${analysisId}`
          : undefined,
        accessCount: 0,
        createdAt: new Date(),
        status: 'active'
      };
      
      setActiveShares(prev => [newShare, ...prev]);
      onShareCreated?.(newShare);
      
      if (configuration.method === 'link' && newShare.shareUrl) {
        navigator.clipboard.writeText(newShare.shareUrl);
        toast("Share link created and copied to clipboard", { type: 'success' });
      } else if (configuration.method === 'email') {
        toast(`Analysis shared with ${configuration.emailOptions?.recipients.length || 0} recipients`, { type: 'success' });
      } else {
        toast("Analysis exported and ready for sharing", { type: 'success' });
      }
      
      setIsOpen(false);
    } catch {
      toast("Unable to create share. Please try again.", { type: 'error' });
    } finally {
      setIsCreating(false);
    }
  }, [analysisId, configuration, onShareCreated, toast]);

  const handleRevokeShare = useCallback((shareId: string) => {
    setActiveShares(prev => prev.filter(share => share.id !== shareId));
    onShareRevoked?.(shareId);
    toast("Share access revoked", { type: 'success' });
  }, [onShareRevoked, toast]);

  const handleCopyLink = useCallback((shareUrl: string) => {
    navigator.clipboard.writeText(shareUrl);
    toast("Share link copied to clipboard", { type: 'success' });
  }, [toast]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className={className}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Share Analysis</span>
          </DialogTitle>
          <DialogDescription>
            Share "{analysisTitle}" with others using secure links, email, or exports.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeShares.length > 0 ? "create" : "create"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Share</TabsTrigger>
            <TabsTrigger value="manage">
              Manage Shares
              {activeShares.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeShares.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="space-y-6">
            {/* Quick Share Methods */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Sharing Method</h3>
              <QuickShareMethods onMethodSelect={handleMethodSelect} />
            </div>

            <Separator />

            {/* Configuration */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Configure Share Settings</h3>
              {selectedMethod === 'link' && (
                <LinkSharingConfig
                  configuration={configuration}
                  onChange={handleConfigurationChange}
                />
              )}
              {selectedMethod === 'email' && (
                <EmailSharingConfig
                  configuration={configuration}
                  onChange={handleConfigurationChange}
                />
              )}
              {selectedMethod === 'export' && (
                <ExportSharingConfig
                  configuration={configuration}
                  onChange={handleConfigurationChange}
                />
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateShare}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <Settings className="h-4 w-4" />
                    </motion.div>
                    Creating Share...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Create Share
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="manage" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Active Shares</h3>
              <ActiveSharesList
                shares={activeShares}
                onRevoke={handleRevokeShare}
                onCopyLink={handleCopyLink}
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Button from '@/components/Button';
import Input from '@/components/ui/Input';
import { FiUpload, FiLink, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

type AttachmentType = 'none' | 'file' | 'url';

export default function CreateProjectPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentType, setAttachmentType] = useState<AttachmentType>('none');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentUrl, setDocumentUrl] = useState('');
  
  // Error state
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    file?: string;
    url?: string;
    general?: string;
  }>({});

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        router.push('/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('full_name, email, avatar_url')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        setUser({
          name: authUser.email || 'User',
          email: authUser.email || '',
          role: 'Student',
        });
      } else {
        setUser({
          name: profile.full_name || authUser.email || 'User',
          email: profile.email || authUser.email || '',
          role: 'Student',
          avatar: profile.avatar_url || undefined,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setUser({
        name: 'User',
        email: '',
        role: 'Student',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setErrors({ ...errors, file: 'Only PDF, DOC, and DOCX files are allowed' });
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setErrors({ ...errors, file: 'File size must be less than 10MB' });
      return;
    }

    setSelectedFile(file);
    setAttachmentType('file');
    setDocumentUrl('');
    setErrors({ ...errors, file: undefined });
  };

  const handleUrlChange = (value: string) => {
    setDocumentUrl(value);
    if (value) {
      setAttachmentType('url');
      setSelectedFile(null);
    } else {
      setAttachmentType('none');
    }
    setErrors({ ...errors, url: undefined });
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = 'Project title is required';
    }

    if (!description.trim()) {
      newErrors.description = 'Project description is required';
    }

    if (attachmentType === 'url' && documentUrl) {
      try {
        new URL(documentUrl);
      } catch {
        newErrors.url = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      
      if (attachmentType === 'file' && selectedFile) {
        formData.append('file', selectedFile);
      } else if (attachmentType === 'url' && documentUrl) {
        formData.append('documentUrl', documentUrl);
      }

      const response = await fetch('/api/projects/create', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      // Redirect to the project detail page
      router.push(`/student/projects/${data.projectId}`);
    } catch (error: any) {
      console.error('Error creating project:', error);
      setErrors({ general: error.message || 'Failed to create project. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearAttachment = () => {
    setSelectedFile(null);
    setDocumentUrl('');
    setAttachmentType('none');
    setErrors({ ...errors, file: undefined, url: undefined });
  };

  if (isLoading) {
    return (
      <DashboardLayout role="student" user={{ name: 'Loading...', email: '', role: 'Student' }} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
            <p className="text-neutral-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Create New Project</h1>
          <p className="text-neutral-600 mt-1">Start your research project</p>
        </div>

        {/* Form Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
                {errors.general}
              </div>
            )}

            {/* Project Title */}
            <Input
              label="Project Title"
              placeholder="Enter your project title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              required
            />

            {/* Project Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description <span className="text-error-500">*</span>
              </label>
              <textarea
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                  errors.description ? 'border-error-500' : 'border-neutral-300'
                }`}
                placeholder="Provide a brief description of your project"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-error-600">{errors.description}</p>
              )}
            </div>

            {/* Document Attachment Section */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-neutral-700">
                Document Attachment (Optional)
              </label>
              
              {/* Attachment Type Selection */}
              {attachmentType === 'none' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Upload Option */}
                  <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 hover:border-primary-500 transition-colors">
                    <label className="cursor-pointer flex flex-col items-center space-y-2">
                      <FiUpload className="text-3xl text-neutral-400" />
                      <span className="text-sm font-medium text-neutral-700">Upload File</span>
                      <span className="text-xs text-neutral-500">PDF, DOC, DOCX (Max 10MB)</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>

                  {/* URL Option */}
                  <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 hover:border-primary-500 transition-colors">
                    <button
                      type="button"
                      onClick={() => setAttachmentType('url')}
                      className="w-full flex flex-col items-center space-y-2"
                    >
                      <FiLink className="text-3xl text-neutral-400" />
                      <span className="text-sm font-medium text-neutral-700">External Link</span>
                      <span className="text-xs text-neutral-500">Link to external document</span>
                    </button>
                  </div>
                </div>
              )}

              {/* File Selected */}
              {attachmentType === 'file' && selectedFile && (
                <div className="border border-neutral-300 rounded-lg p-4 bg-neutral-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FiUpload className="text-primary-500" />
                      <div>
                        <p className="text-sm font-medium text-neutral-700">{selectedFile.name}</p>
                        <p className="text-xs text-neutral-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearAttachment}
                      className="text-neutral-500 hover:text-error-600 transition-colors"
                    >
                      <FiX className="text-xl" />
                    </button>
                  </div>
                </div>
              )}

              {/* URL Input */}
              {attachmentType === 'url' && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="https://example.com/document.pdf"
                      value={documentUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      error={errors.url}
                    />
                    <button
                      type="button"
                      onClick={clearAttachment}
                      className="text-neutral-500 hover:text-error-600 transition-colors p-2"
                    >
                      <FiX className="text-xl" />
                    </button>
                  </div>
                </div>
              )}

              {errors.file && (
                <p className="text-sm text-error-600">{errors.file}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-neutral-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/student/projects')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}

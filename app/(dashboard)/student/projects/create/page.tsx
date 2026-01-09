'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Button from '@/components/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { FiUpload, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [researchType, setResearchType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Error state
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    researchType?: string;
    file?: string;
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

  const validateFile = (file: File): string | null => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF, DOC, and DOCX files are allowed';
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setErrors({ ...errors, file: error });
      return;
    }

    setSelectedFile(file);
    setErrors({ ...errors, file: undefined });
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setErrors({ ...errors, file: error });
      return;
    }

    setSelectedFile(file);
    setErrors({ ...errors, file: undefined });
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = 'Project title is required';
    }

    if (!description.trim()) {
      newErrors.description = 'Project description is required';
    }

    if (!researchType) {
      newErrors.researchType = 'Research type is required';
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
      formData.append('researchType', researchType);
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch('/api/projects/create', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      // Redirect to the projects list page
      router.push('/student/projects');
    } catch (error: any) {
      console.error('Error creating project:', error);
      setErrors({ general: error.message || 'Failed to create project. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearAttachment = () => {
    setSelectedFile(null);
    setErrors({ ...errors, file: undefined });
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

            {/* Paper Standard */}
            <Select
              label="Paper Standard"
              placeholder="Select paper standard"
              value={researchType}
              onChange={(e) => setResearchType(e.target.value)}
              options={[
                { value: 'IMRAD', label: 'IMRAD' },
                { value: 'IAAA', label: 'IAAA' },
                { value: 'custom', label: 'Custom' },
              ]}
              error={errors.researchType}
              required
            />

            {/* Document Attachment Section */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-neutral-700">
                Document Attachment (Optional)
              </label>
              
              {/* File Upload Area with Drag and Drop */}
              {!selectedFile && (
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 transition-all ${
                    isDragging
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-300 hover:border-primary-500 hover:bg-neutral-50'
                  }`}
                >
                  <label className="cursor-pointer flex flex-col items-center space-y-3">
                    <div className={`p-4 rounded-full transition-colors ${
                      isDragging ? 'bg-primary-100' : 'bg-neutral-100'
                    }`}>
                      <FiUpload className={`text-3xl transition-colors ${
                        isDragging ? 'text-primary-600' : 'text-neutral-400'
                      }`} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-neutral-700">
                        {isDragging ? 'Drop file here' : 'Drag and drop your file here'}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">or click to browse</p>
                      <p className="text-xs text-neutral-500 mt-2">PDF, DOC, DOCX (Max 10MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              )}

              {/* File Selected */}
              {selectedFile && (
                <div className="border border-neutral-300 rounded-lg p-4 bg-neutral-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-100 rounded">
                        <FiUpload className="text-primary-500" />
                      </div>
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

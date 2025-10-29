"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Image as ImageIcon,
  X,
  Upload,
} from "lucide-react";
import { apiClient } from "@/lib/axios";
import { toast } from "sonner";
import SmartLoader from "@/components/ui/loader";
import ModalDelete from "@/components/ui/modal-delete";
import { AxiosError } from "axios";

interface Equipment {
  id: string;
  name: string;
  category: string;
  stock: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EquipmentFormData {
  name: string;
  category: string;
  stock: number;
  image: File | null;
}

export default function EquipmentPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState<EquipmentFormData>({
    name: "",
    category: "",
    stock: 1,
    image: null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Fetch equipments
  const fetchEquipments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter) params.append("category", categoryFilter);

      const res = await apiClient.get(`/equipments?${params.toString()}`);
      setEquipments(res.data.data);
    } catch (err) {
      console.error("Fetch equipments error:", err);
      toast.error("Gagal mengambil data equipment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search
  const handleSearch = () => {
    fetchEquipments();
  };

  // Open modal for create
  const openCreateModal = () => {
    setEditMode(false);
    setEditId(null);
    setFormData({
      name: "",
      category: "",
      stock: 1,
      image: null,
    });
    setImagePreview(null);
    setShowModal(true);
  };

  // Open modal for edit
  const openEditModal = (equipment: Equipment) => {
    setEditMode(true);
    setEditId(equipment.id);
    setFormData({
      name: equipment.name,
      category: equipment.category,
      stock: equipment.stock,
      image: null,
    });
    setImagePreview(equipment.imageUrl);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setFormData({
      name: "",
      category: "",
      stock: 1,
      image: null,
    });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle image select
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle submit (create/update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category) {
      toast.error("Nama dan kategori wajib diisi");
      return;
    }

    try {
      setSubmitting(true);
      const form = new FormData();
      form.append("name", formData.name);
      form.append("category", formData.category);
      form.append("stock", formData.stock.toString());
      if (formData.image) {
        form.append("image", formData.image);
      }

      if (editMode && editId) {
        // Update
        await apiClient.put(`/equipments/${editId}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Equipment berhasil diupdate");
      } else {
        // Create
        await apiClient.post("/equipments", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Equipment berhasil ditambahkan");
      }

      closeModal();
      fetchEquipments();
    } catch (err) {
      console.error("Submit error:", err);
      if (err instanceof AxiosError && err.response) {
        const errorData = err.response.data;
        toast.error(errorData.message || "Terjadi kesalahan");
      } else {
        toast.error("Terjadi kesalahan saat menyimpan equipment");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await apiClient.delete(`/equipments/${deleteTarget.id}`);
      toast.success("Equipment berhasil dihapus");
      fetchEquipments();
    } catch (err) {
      console.error("Delete error:", err);
      if (err instanceof AxiosError && err.response) {
        toast.error(err.response.data.message || "Gagal menghapus equipment");
      } else {
        toast.error("Terjadi kesalahan saat menghapus equipment");
      }
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return <SmartLoader />;
  }

  return (
    <div className="w-full px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white"
          onClick={openCreateModal}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Equipment
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <Input
              type="text"
              placeholder="Cari equipment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              onClick={handleSearch}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-none"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="px-4"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Kategori
                  </label>
                  <Input
                    type="text"
                    placeholder="Semua kategori"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={fetchEquipments} className="flex-1">
                    Terapkan Filter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCategoryFilter("");
                      setSearch("");
                      fetchEquipments();
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Equipment Grid */}
      {equipments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Tidak ada equipment ditemukan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {equipments.map((equipment) => (
            <Card
              key={equipment.id}
              className="overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200"
            >
              <div className="relative h-32 sm:h-36 md:h-40 lg:h-48 bg-linear-to-br from-gray-50 to-gray-100">
                {equipment.imageUrl ? (
                  <Image
                    src={equipment.imageUrl}
                    alt={equipment.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-gray-300" />
                  </div>
                )}
              </div>
              <CardContent className="p-2.5 sm:p-3 md:p-4">
                <h3 className="font-semibold text-gray-900 text-xs sm:text-sm md:text-base mb-0.5 md:mb-1 line-clamp-1">
                  {equipment.name}
                </h3>
                <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mb-2 md:mb-3 line-clamp-1">
                  {equipment.category}
                </p>
                {/* Stock Badge */}
                <div className="mb-2 md:mb-3">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] md:text-xs font-medium ${
                      equipment.stock === 0
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : equipment.stock < 3
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                        : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    }`}
                  >
                    📦 Stok: {equipment.stock}
                  </span>
                </div>
                <div className="flex gap-1.5 md:gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 md:h-8 text-[10px] md:text-xs px-1.5 md:px-2"
                    onClick={() => openEditModal(equipment)}
                  >
                    <Edit2 className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 md:h-8 text-[10px] md:text-xs px-1.5 md:px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(equipment.id, equipment.name)}
                  >
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                    <span className="hidden sm:inline">Hapus</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black opacity-60 blur-in-3xl z-40"
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    {editMode ? "Edit Equipment" : "Tambah Equipment"}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeModal}
                    disabled={submitting}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <Label htmlFor="name">Nama Equipment *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Contoh: Speaker Yamaha DXR15"
                      disabled={submitting}
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <Label htmlFor="category">Kategori *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      placeholder="Contoh: Speaker, Mixer, Microphone"
                      disabled={submitting}
                      required
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <Label htmlFor="stock">Jumlah Stok *</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stock: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      placeholder="Contoh: 5"
                      disabled={submitting}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Jumlah unit yang tersedia
                    </p>
                  </div>

                  {/* Image */}
                  <div>
                    <Label htmlFor="image">Gambar</Label>
                    <div className="mt-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="image"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageChange}
                        disabled={submitting}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={submitting}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {formData.image ? formData.image.name : "Pilih Gambar"}
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">
                        Format: JPEG, PNG, WebP. Maksimal 5MB
                      </p>
                    </div>

                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mt-3 relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={closeModal}
                      disabled={submitting}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-500 hover:bg-blue-600"
                      disabled={submitting}
                    >
                      {submitting
                        ? "Menyimpan..."
                        : editMode
                        ? "Update"
                        : "Simpan"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deleteTarget && (
        <ModalDelete
          content={`Yakin ingin menghapus "${deleteTarget.name}"?`}
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

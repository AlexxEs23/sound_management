"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";
import SmartLoader from "@/components/ui/loader";
import ModalDelete from "@/components/ui/modal-delete";
import {
  HiOutlineExclamationCircle,
  HiPlus,
  HiPencil,
  HiTrash,
  HiX,
  HiCheck,
  HiClock,
} from "react-icons/hi";

interface Equipment {
  id: string;
  name: string;
  category: string;
  stock: number;
  imageUrl: string | null;
}

interface DamagedEquipment {
  id: string;
  equipmentId: string;
  quantity: number;
  description: string | null;
  repairStatus: "pending" | "in_progress" | "completed";
  reportedAt: string;
  repairedAt: string | null;
  equipment: Equipment;
}

interface DamagedFormData {
  equipmentId: string;
  quantity: number;
  description: string;
}

export default function DamagedEquipmentsPage() {
  const [damagedEquipments, setDamagedEquipments] = useState<
    DamagedEquipment[]
  >([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DamagedEquipment | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<DamagedFormData>({
    equipmentId: "",
    quantity: 1,
    description: "",
  });

  // Filter state
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "in_progress" | "completed"
  >("all");

  // Fetch damaged equipments
  const fetchDamagedEquipments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/damaged-equipments");
      setDamagedEquipments(response.data.data);
    } catch (error) {
      console.error("Error fetching damaged equipments:", error);
      toast.error("Gagal memuat data barang rusak");
    } finally {
      setLoading(false);
    }
  };

  // Fetch available equipments for dropdown
  const fetchEquipments = async () => {
    try {
      const response = await apiClient.get("/equipments");
      setEquipments(response.data.data);
    } catch (error) {
      console.error("Error fetching equipments:", error);
      toast.error("Gagal memuat data equipment");
    }
  };

  useEffect(() => {
    fetchDamagedEquipments();
    fetchEquipments();
  }, []);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && editingId) {
        // Update damaged equipment
        await apiClient.put(`/damaged-equipments/${editingId}`, formData);
        toast.success("Data barang rusak berhasil diperbarui");
      } else {
        // Report new damaged equipment
        await apiClient.post("/damaged-equipments", formData);
        toast.success("Barang rusak berhasil dilaporkan");
      }

      setShowModal(false);
      resetForm();
      fetchDamagedEquipments();
      fetchEquipments(); // Refresh to update stock
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || "Terjadi kesalahan";
      toast.error(errorMessage);
    }
  };

  // Update repair status
  const updateStatus = async (
    id: string,
    newStatus: "pending" | "in_progress" | "completed"
  ) => {
    try {
      await apiClient.put(`/damaged-equipments/${id}`, {
        repairStatus: newStatus,
      });
      toast.success(
        `Status berhasil diubah menjadi ${getStatusLabel(newStatus)}`
      );
      fetchDamagedEquipments();
      fetchEquipments(); // Refresh stock if completed
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Gagal mengubah status");
    }
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setIsEditing(false);
    setEditingId(null);
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (damaged: DamagedEquipment) => {
    setFormData({
      equipmentId: damaged.equipmentId,
      quantity: damaged.quantity,
      description: damaged.description || "",
    });
    setIsEditing(true);
    setEditingId(damaged.id);
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      equipmentId: "",
      quantity: 1,
      description: "",
    });
  };

  // Handle delete
  const handleDelete = (damaged: DamagedEquipment) => {
    setDeleteTarget(damaged);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await apiClient.delete(`/damaged-equipments/${deleteTarget.id}`);
      toast.success("Data barang rusak berhasil dihapus");
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchDamagedEquipments();
      fetchEquipments(); // Refresh stock
    } catch (error) {
      console.error("Error deleting damaged equipment:", error);
      toast.error("Gagal menghapus data");
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status label in Indonesian
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Menunggu";
      case "in_progress":
        return "Sedang Diperbaiki";
      case "completed":
        return "Selesai";
      default:
        return status;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <HiOutlineExclamationCircle className="w-4 h-4" />;
      case "in_progress":
        return <HiClock className="w-4 h-4" />;
      case "completed":
        return <HiCheck className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <SmartLoader />;
  }

  const filteredData =
    statusFilter === "all"
      ? damagedEquipments
      : damagedEquipments.filter((d) => d.repairStatus === statusFilter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Manajemen Barang Rusak
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Kelola laporan dan perbaikan equipment yang rusak
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as
                  | "all"
                  | "pending"
                  | "in_progress"
                  | "completed"
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="in_progress">Sedang Diperbaiki</option>
            <option value="completed">Selesai</option>
          </select>

          {/* Stats */}
          <div className="flex-1 flex gap-4 text-sm">
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-red-600 dark:text-red-400 font-medium">
                {
                  damagedEquipments.filter((d) => d.repairStatus === "pending")
                    .length
                }{" "}
                Menunggu
              </span>
            </div>
            <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                {
                  damagedEquipments.filter(
                    (d) => d.repairStatus === "in_progress"
                  ).length
                }{" "}
                Diperbaiki
              </span>
            </div>
          </div>

          {/* Report Button */}
          <Button onClick={openCreateModal}>
            <HiPlus className="mr-2 h-5 w-5" />
            Lapor Barang Rusak
          </Button>
        </div>

        {/* Damaged Equipment List */}
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <HiOutlineExclamationCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Tidak ada data barang rusak
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
              Klik tombol &quot;Lapor Barang Rusak&quot; untuk melaporkan
              kerusakan
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((damaged) => (
              <div
                key={damaged.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-4">
                  {/* Equipment Name */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {damaged.equipment.name}
                  </h3>

                  {/* Category & Quantity */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {damaged.equipment.category}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {damaged.quantity} unit rusak
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        damaged.repairStatus
                      )}`}
                    >
                      {getStatusIcon(damaged.repairStatus)}
                      {getStatusLabel(damaged.repairStatus)}
                    </span>
                  </div>

                  {/* Description */}
                  {damaged.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {damaged.description}
                    </p>
                  )}

                  {/* Dates */}
                  <div className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                    <p>Dilaporkan: {formatDate(damaged.reportedAt)}</p>
                    {damaged.repairedAt && (
                      <p>Selesai: {formatDate(damaged.repairedAt)}</p>
                    )}
                  </div>

                  {/* Status Actions */}
                  {damaged.repairStatus !== "completed" && (
                    <div className="mb-3 flex gap-2">
                      {damaged.repairStatus === "pending" && (
                        <button
                          onClick={() =>
                            updateStatus(damaged.id, "in_progress")
                          }
                          className="flex-1 text-xs py-1.5 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                        >
                          🔧 Mulai Perbaikan
                        </button>
                      )}
                      {damaged.repairStatus === "in_progress" && (
                        <button
                          onClick={() => updateStatus(damaged.id, "completed")}
                          className="flex-1 text-xs py-1.5 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/50"
                        >
                          ✓ Selesaikan Perbaikan
                        </button>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => openEditModal(damaged)}
                      disabled={damaged.repairStatus === "completed"}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <HiPencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(damaged)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <HiTrash className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isEditing ? "Edit Laporan" : "Lapor Barang Rusak"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <HiX className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Equipment Selection */}
                <div>
                  <Label htmlFor="equipmentId">Equipment *</Label>
                  <select
                    id="equipmentId"
                    value={formData.equipmentId}
                    onChange={(e) =>
                      setFormData({ ...formData, equipmentId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    disabled={isEditing}
                  >
                    <option value="">Pilih Equipment</option>
                    {equipments
                      .filter((eq) => eq.stock > 0)
                      .map((equipment) => (
                        <option key={equipment.id} value={equipment.id}>
                          {equipment.name} - {equipment.category} (Stok:{" "}
                          {equipment.stock})
                        </option>
                      ))}
                  </select>
                  {isEditing && (
                    <p className="text-xs text-gray-500 mt-1">
                      Equipment tidak bisa diubah saat edit
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <Label htmlFor="quantity">Jumlah Unit Rusak *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    max={
                      formData.equipmentId
                        ? equipments.find((e) => e.id === formData.equipmentId)
                            ?.stock || 1
                        : undefined
                    }
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                    disabled={isEditing}
                  />
                  {formData.equipmentId && !isEditing && (
                    <p className="text-xs text-gray-500 mt-1">
                      Max:{" "}
                      {equipments.find((e) => e.id === formData.equipmentId)
                        ?.stock || 0}{" "}
                      unit
                    </p>
                  )}
                  {isEditing && (
                    <p className="text-xs text-gray-500 mt-1">
                      Quantity tidak bisa diubah saat edit
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Deskripsi Kerusakan</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Jelaskan kondisi kerusakan..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1">
                    {isEditing ? "Update" : "Lapor"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deleteTarget && (
          <ModalDelete
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setDeleteTarget(null);
            }}
            onConfirm={confirmDelete}
            content={`Apakah Anda yakin ingin menghapus laporan kerusakan untuk "${deleteTarget.equipment.name}"? Stok akan dikembalikan.`}
          />
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";
import SmartLoader from "@/components/ui/loader";
import ModalDelete from "@/components/ui/modal-delete";
import {
  HiCalendar,
  HiLocationMarker,
  HiPencil,
  HiPlus,
  HiSearch,
  HiTrash,
  HiX,
  HiCube,
} from "react-icons/hi";

interface Equipment {
  id: string;
  name: string;
  category: string;
  stock: number;
  imageUrl: string | null;
}

interface EquipmentEvent {
  id: string;
  equipmentId: string;
  eventId: string;
  quantity: number;
  equipment: Equipment;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: "upcoming" | "ongoing" | "completed";
  reportGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  EquipmentEvent?: EquipmentEvent[];
}

interface EquipmentWithQuantity {
  equipmentId: string;
  quantity: number;
}

interface EventFormData {
  title: string;
  description: string;
  date: string;
  location: string;
  status?: "upcoming" | "ongoing" | "completed";
  equipments: EquipmentWithQuantity[];
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    date: "",
    location: "",
    equipments: [],
  });

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "upcoming" | "ongoing" | "completed"
  >("all");

  // Fetch equipments
  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const response = await apiClient.get("/equipments");
        setEquipments(response.data.data);
      } catch (error) {
        console.error("Error fetching equipments:", error);
        toast.error("Gagal memuat data equipment");
      }
    };
    fetchEquipments();
  }, []);

  // Fetch events function
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (locationFilter) params.append("location", locationFilter);

      const response = await apiClient.get(`/events?${params.toString()}`);
      setEvents(response.data.data);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Gagal memuat data event");
    } finally {
      setLoading(false);
    }
  };

  // Fetch events on mount and when filters change
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, locationFilter]);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && editingId) {
        // Update event
        await apiClient.put(`/events/${editingId}`, formData);
        toast.success("Event berhasil diperbarui");
      } else {
        // Create event
        await apiClient.post("/events", formData);
        toast.success("Event berhasil dibuat");
      }

      setShowModal(false);
      resetForm();

      // Refresh halaman untuk memuat data terbaru
      window.location.reload();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || "Terjadi kesalahan";
      toast.error(errorMessage);
    }
  };

  // Handle delete
  const handleDelete = (event: Event) => {
    setDeleteTarget(event);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await apiClient.delete(`/events/${deleteTarget.id}`);
      toast.success("Event berhasil dihapus");
      setShowDeleteModal(false);
      setDeleteTarget(null);

      // Refresh halaman untuk memuat data terbaru
      window.location.reload();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Gagal menghapus event");
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
  const openEditModal = (event: Event) => {
    setFormData({
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString().split("T")[0],
      location: event.location,
      equipments:
        event.EquipmentEvent?.map((ee) => ({
          equipmentId: ee.equipmentId,
          quantity: ee.quantity,
        })) || [],
    });
    setIsEditing(true);
    setEditingId(event.id);
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      location: "",
      equipments: [],
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Add or update equipment with quantity
  const addEquipmentWithQuantity = (equipmentId: string, quantity: number) => {
    setFormData((prev) => {
      const existingIndex = prev.equipments.findIndex(
        (eq) => eq.equipmentId === equipmentId
      );

      if (existingIndex >= 0) {
        // Update existing quantity
        const updated = [...prev.equipments];
        updated[existingIndex] = { equipmentId, quantity };
        return { ...prev, equipments: updated };
      } else {
        // Add new equipment
        return {
          ...prev,
          equipments: [...prev.equipments, { equipmentId, quantity }],
        };
      }
    });
  };

  // Remove equipment
  const removeEquipment = (equipmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      equipments: prev.equipments.filter(
        (eq) => eq.equipmentId !== equipmentId
      ),
    }));
  };

  // Get selected quantity for equipment
  const getSelectedQuantity = (equipmentId: string): number => {
    const selected = formData.equipments.find(
      (eq) => eq.equipmentId === equipmentId
    );
    return selected?.quantity || 0;
  };

  // Update event status
  const updateEventStatus = async (
    eventId: string,
    newStatus: "upcoming" | "ongoing" | "completed"
  ) => {
    try {
      const event = events.find((e) => e.id === eventId);
      if (!event) return;

      await apiClient.put(`/events/${eventId}`, {
        ...event,
        status: newStatus,
        date: event.date, // Keep original date
      });

      toast.success(
        `Status event berhasil diubah menjadi ${getStatusLabel(newStatus)}`
      );
      fetchEvents();
    } catch (error) {
      console.error("Error updating event status:", error);
      toast.error("Gagal mengubah status event");
    }
  };

  // Generate event report
  const generateReport = async (event: Event) => {
    try {
      // In real app, this would generate a PDF or detailed report
      const reportData = {
        title: event.title,
        date: formatDate(event.date),
        location: event.location,
        description: event.description,
        equipments: event.EquipmentEvent?.map((ee) => ({
          name: ee.equipment.name,
          category: ee.equipment.category,
          quantity: ee.quantity,
        })),
        totalItems: event.EquipmentEvent?.reduce(
          (sum, ee) => sum + ee.quantity,
          0
        ),
      };

      console.log("Event Report:", reportData);

      // Update reportGenerated status
      await apiClient.put(`/events/${event.id}`, {
        ...event,
        reportGenerated: true,
        date: event.date,
      });

      toast.success("Laporan event berhasil dibuat");
      fetchEvents();

      // TODO: Implement actual PDF generation or detailed report page
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Gagal membuat laporan");
    }
  };

  // Get status label in Indonesian
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "upcoming":
        return "Akan Datang";
      case "ongoing":
        return "Sedang Berlangsung";
      case "completed":
        return "Selesai";
      default:
        return status;
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "ongoing":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  // Get unique locations for filter
  const uniqueLocations = Array.from(new Set(events.map((e) => e.location)));

  if (loading) {
    return <SmartLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Manajemen Event
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Kelola event dan kegiatan organisasi
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          {/* Location Filter */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="">Semua Lokasi</option>
            {uniqueLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "all" | "upcoming" | "ongoing" | "completed"
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="all">Semua Status</option>
            <option value="upcoming">Akan Datang</option>
            <option value="ongoing">Sedang Berlangsung</option>
            <option value="completed">Selesai</option>
          </select>

          {/* Create Button */}
          <Button onClick={openCreateModal}>
            <HiPlus className="mr-2 h-5 w-5" />
            Tambah Event
          </Button>
        </div>

        {/* Event Grid */}
        {events.filter(
          (e) => statusFilter === "all" || e.status === statusFilter
        ).length === 0 ? (
          <div className="text-center py-12">
            <HiCalendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Belum ada event
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
              Klik tombol &quot;Tambah Event&quot; untuk membuat event baru
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {events
              .filter(
                (e) => statusFilter === "all" || e.status === statusFilter
              )
              .map((event) => (
                <div
                  key={event.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-4">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {event.title}
                    </h3>

                    {/* Status Badge */}
                    <div className="mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          event.status
                        )}`}
                      >
                        {getStatusLabel(event.status)}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <HiCalendar className="mr-2 h-4 w-4 shrink-0" />
                      <span className="text-xs">{formatDate(event.date)}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <HiLocationMarker className="mr-2 h-4 w-4 shrink-0" />
                      <span className="text-xs line-clamp-1">
                        {event.location}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                      {event.description}
                    </p>

                    {/* Equipment Info */}
                    {event.EquipmentEvent &&
                      event.EquipmentEvent.length > 0 && (
                        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <HiCube className="mr-1 h-3.5 w-3.5" />
                            <span className="font-medium">
                              {event.EquipmentEvent.length} jenis peralatan
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-500 ml-5">
                            Total:{" "}
                            {event.EquipmentEvent.reduce(
                              (sum, ee) => sum + ee.quantity,
                              0
                            )}{" "}
                            item
                          </p>
                        </div>
                      )}

                    {/* Status Actions - only show if not completed */}
                    {event.status !== "completed" && (
                      <div className="mb-3 flex gap-2">
                        {event.status === "upcoming" && (
                          <button
                            onClick={() =>
                              updateEventStatus(event.id, "ongoing")
                            }
                            className="flex-1 text-xs py-1.5 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/50"
                          >
                            Mulai Event
                          </button>
                        )}
                        {event.status === "ongoing" && (
                          <button
                            onClick={() =>
                              updateEventStatus(event.id, "completed")
                            }
                            className="flex-1 text-xs py-1.5 bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            Selesaikan Event
                          </button>
                        )}
                      </div>
                    )}

                    {/* Report Button - only show for completed events */}
                    {event.status === "completed" && !event.reportGenerated && (
                      <div className="mb-3">
                        <button
                          onClick={() => generateReport(event)}
                          className="w-full text-xs py-1.5 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded hover:bg-purple-100 dark:hover:bg-purple-900/50"
                        >
                          📄 Generate Laporan
                        </button>
                      </div>
                    )}

                    {/* Report Status - if already generated */}
                    {event.reportGenerated && (
                      <div className="mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-xs text-purple-700 dark:text-purple-400 flex items-center gap-1">
                          ✓ Laporan sudah dibuat
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => openEditModal(event)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <HiPencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event)}
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

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isEditing ? "Edit Event" : "Tambah Event Baru"}
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
                {/* Title */}
                <div>
                  <Label htmlFor="title">Judul Event</Label>
                  <Input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Date */}
                <div>
                  <Label htmlFor="date">Tanggal</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Location */}
                <div>
                  <Label htmlFor="location">Lokasi</Label>
                  <Input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                {/* Equipment Selection */}
                <div>
                  <Label>Peralatan yang Digunakan (Opsional)</Label>
                  <div className="mt-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3 dark:border-gray-600">
                    {equipments.filter(
                      (eq) => eq.stock > 0 || getSelectedQuantity(eq.id) > 0
                    ).length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Tidak ada peralatan tersedia
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {equipments
                          .filter(
                            (eq) =>
                              eq.stock > 0 || getSelectedQuantity(eq.id) > 0
                          )
                          .map((equipment) => {
                            const selectedQty = getSelectedQuantity(
                              equipment.id
                            );
                            const isSelected = selectedQty > 0;

                            return (
                              <div
                                key={equipment.id}
                                className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {equipment.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {equipment.category} • Stok:{" "}
                                    {equipment.stock}
                                  </p>
                                </div>

                                {isSelected ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (selectedQty > 1) {
                                          addEquipmentWithQuantity(
                                            equipment.id,
                                            selectedQty - 1
                                          );
                                        } else {
                                          removeEquipment(equipment.id);
                                        }
                                      }}
                                      className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                                    >
                                      -
                                    </button>
                                    <span className="w-12 text-center text-sm font-medium text-gray-900 dark:text-white">
                                      {selectedQty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (selectedQty < equipment.stock) {
                                          addEquipmentWithQuantity(
                                            equipment.id,
                                            selectedQty + 1
                                          );
                                        }
                                      }}
                                      disabled={selectedQty >= equipment.stock}
                                      className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      +
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeEquipment(equipment.id)
                                      }
                                      className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                      <HiX className="w-5 h-5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      addEquipmentWithQuantity(equipment.id, 1)
                                    }
                                    disabled={equipment.stock === 0}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Tambah
                                  </button>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                  {formData.equipments.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {formData.equipments.length} jenis peralatan dipilih
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Total:{" "}
                        {formData.equipments.reduce(
                          (sum, eq) => sum + eq.quantity,
                          0
                        )}{" "}
                        item
                      </p>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {isEditing ? "Update Event" : "Buat Event"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        <ModalDelete
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
          onConfirm={confirmDelete}
          content={`Apakah Anda yakin ingin menghapus event "${
            deleteTarget?.title || "ini"
          }"?`}
        />
      </div>
    </div>
  );
}

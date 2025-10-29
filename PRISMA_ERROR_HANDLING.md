# Prisma Error Handling Guide

Helper untuk menangani Prisma errors dengan pesan yang user-friendly dalam Bahasa Indonesia.

## 📁 File Location

`/lib/prisma-error-handler.ts`

## 🎯 Fitur

### 1. **handlePrismaError(error)**

Mengkonversi Prisma error codes menjadi pesan yang mudah dipahami user.

**Key Features:**

- ✅ Support `PrismaClientKnownRequestError` instance
- ✅ Support plain object (serialized error)
- ✅ Auto-extract field name dari constraint key (e.g., `Users_noWa_key` → `noWa`)
- ✅ User-friendly messages dalam Bahasa Indonesia

**Supported Error Codes:**

| Code    | Deskripsi                  | Status | Pesan User                                                    |
| ------- | -------------------------- | ------ | ------------------------------------------------------------- |
| `P2000` | Value terlalu panjang      | 400    | "[Field] terlalu panjang"                                     |
| `P2001` | Record tidak ditemukan     | 404    | "Data tidak ditemukan"                                        |
| `P2002` | **Duplicate entry**        | 409    | "[Field] sudah terdaftar. Silakan gunakan [field] yang lain." |
| `P2003` | Foreign key constraint     | 400    | "Data yang Anda rujuk tidak ditemukan di database"            |
| `P2004` | Database constraint        | 400    | "Database constraint failed"                                  |
| `P2011` | Null constraint            | 400    | "[Field] wajib diisi"                                         |
| `P2024` | Connection timeout         | 503    | "Koneksi database timeout. Silakan coba lagi."                |
| `P2025` | Record to delete not found | 404    | "Data yang Anda cari tidak ditemukan"                         |

### 2. **handlePrismaOperation(operation)**

Wrapper async untuk menjalankan operasi database dengan error handling otomatis.

## 🚀 Cara Penggunaan

### Method 1: Direct Error Handling (Recommended untuk API Routes)

```typescript
import { handlePrismaError } from "@/lib/prisma-error-handler";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const user = await prisma.users.create({
      data: {
        email: body.email,
        name: body.name,
        password: body.password,
      },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (err) {
    // Handle Prisma errors
    const prismaError = handlePrismaError(err);

    if (prismaError) {
      return NextResponse.json(
        {
          error: "Database error",
          message: prismaError.message,
          field: prismaError.field,
          code: prismaError.code,
        },
        { status: prismaError.code === "P2002" ? 409 : 400 }
      );
    }

    // Fallback untuk unexpected errors
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

### Method 2: Using Wrapper Function

```typescript
import { handlePrismaOperation } from "@/lib/prisma-error-handler";
import { prisma } from "@/lib/prisma";

// Di dalam function
const result = await handlePrismaOperation(async () => {
  return await prisma.users.create({
    data: { email, name, password },
  });
});

if (!result.success) {
  return NextResponse.json({ message: result.error.message }, { status: 400 });
}

const user = result.data;
```

## 🎨 Frontend Integration

### Dengan Toast Notifications (Sonner)

```typescript
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";
import { AxiosError } from "axios";

try {
  const res = await apiClient.post("/auth/register", formData);

  if (res.status === 201) {
    toast.success("Registrasi berhasil!");
  }
} catch (err) {
  if (err instanceof AxiosError && err.response) {
    const errorData = err.response.data;

    // Tampilkan error message dari backend
    if (errorData.message) {
      toast.error(errorData.message, {
        description: errorData.field ? `Field: ${errorData.field}` : undefined,
        duration: 5000,
      });

      // Set error pada field yang bermasalah (optional)
      if (errorData.field) {
        setErrors({
          [errorData.field]: errorData.message,
        });
      }
    }
  }
}
```

## 📝 Error Response Format

API akan mengembalikan response dengan format konsisten:

```json
{
  "error": "Database error",
  "message": "Email sudah terdaftar. Silakan gunakan email yang lain.",
  "field": "email",
  "code": "P2002"
}
```

## 🔧 Customization

### Menambah Field Name Mapping

Edit file `/lib/prisma-error-handler.ts`:

```typescript
const FIELD_NAMES: Record<string, string> = {
  email: "Email",
  noWa: "Nomor WhatsApp",
  name: "Nama",
  username: "Username",
  phone: "Nomor Telepon",
  // Tambahkan field baru di sini
  address: "Alamat",
  city: "Kota",
};
```

### Menambah Custom Error Messages

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  P2002: "Duplicate entry",
  P2025: "Record to delete does not exist",
  // Tambahkan custom messages
  P2028: "Custom error message anda",
};
```

## ✅ Best Practices

1. **Selalu handle Prisma errors di API routes**, jangan biarkan error mentah terkirim ke frontend
2. **Gunakan toast notifications** untuk memberikan feedback visual yang jelas
3. **Set field-specific errors** pada form untuk UX yang lebih baik
4. **Log errors** di server untuk debugging: `console.error("Error:", err)`
5. **Return status codes yang tepat**:
   - `400` - Bad Request / Validation Error
   - `401` - Unauthorized
   - `404` - Not Found
   - `409` - Conflict (Duplicate)
   - `500` - Internal Server Error

## 🔧 Technical Details

### Error Serialization Handling

Helper ini dapat menangani 2 jenis error:

#### 1. Instance Error (Normal Case)

```typescript
if (error instanceof PrismaClientKnownRequestError) {
  // Handle error langsung dari Prisma
}
```

#### 2. Plain Object Error (Serialized Case)

```typescript
if (
  error &&
  typeof error === "object" &&
  "code" in error &&
  error.name === "PrismaClientKnownRequestError"
) {
  // Handle error yang sudah di-serialize oleh Next.js/framework
}
```

**Mengapa perlu 2 cara?**
Kadang error Prisma di-serialize jadi plain object sebelum masuk catch block, terutama di Next.js App Router dengan server actions. Dengan dual handling, semua kasus tercakup.

### Field Name Extraction

Helper ini otomatis extract field name dari constraint key:

```typescript
// Input: "Users_noWa_key"
// Output: "noWa"

const match = meta.target.match(/Users_(\w+)_key/);
if (match) {
  return match[1]; // Extract field name
}
```

Ini penting karena Prisma mengembalikan constraint name lengkap, bukan nama field saja.

## 🧪 Testing Error Scenarios

### Test Duplicate Email

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test","password":"123456","noWa":"081234567890"}'
```

Submit form yang sama dua kali untuk memicu P2002 error.

### Test Validation Error

Submit form dengan data kosong atau invalid.

### Test Database Connection

Matikan database dan test apakah timeout error ditangani dengan baik.

## 📚 References

- [Prisma Error Reference](https://www.prisma.io/docs/reference/api-reference/error-reference)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Sonner Toast Library](https://sonner.emilkowal.ski/)

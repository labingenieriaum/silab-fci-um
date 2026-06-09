-- DropForeignKey
ALTER TABLE "prestamos" DROP CONSTRAINT "prestamos_usuario_solicitante_id_fkey";

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_usuario_solicitante_id_fkey" FOREIGN KEY ("usuario_solicitante_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

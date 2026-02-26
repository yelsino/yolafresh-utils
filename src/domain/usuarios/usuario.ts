
import { IUsuario, ConfiguracionUsuario } from "@/domain/shared/interfaces/usuario";
import { Entidad, Rol, SesionContexto } from "@/domain/shared/interfaces/entidades";

/**
 * Entidad de Dominio Usuario
 * 
 * Implementa la lógica de negocio asociada a la cuenta de usuario.
 */
export class Usuario implements IUsuario {
  public readonly id: string;
  public username: string;
  public email?: string;
  public passwordHash: string;
  public roles: Rol[] = [];
  public entidades: Entidad[] = [];
  public activo: boolean;
  public createdAt: Date;
  public updatedAt: Date;
  public fechaUltimoAcceso?: Date;
  public intentosFallidos: number = 0;
  public cuentaBloqueada: boolean = false;
  public fechaBloqueo?: Date;
  public tokenVerificacion?: string;
  public emailVerificado: boolean = false;
  public configuraciones?: ConfiguracionUsuario;
  public sesionActual?: SesionContexto;
  public debeCambiarPassword?: boolean;

  constructor(data: IUsuario) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.roles = data.roles || [];
    this.entidades = data.entidades || [];
    this.activo = data.activo;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.fechaUltimoAcceso = data.fechaUltimoAcceso;
    this.intentosFallidos = data.intentosFallidos || 0;
    this.cuentaBloqueada = data.cuentaBloqueada || false;
    this.fechaBloqueo = data.fechaBloqueo;
    this.tokenVerificacion = data.tokenVerificacion;
    this.emailVerificado = data.emailVerificado || false;
    this.configuraciones = data.configuraciones;
    this.sesionActual = data.sesionActual;
    this.debeCambiarPassword = data.debeCambiarPassword;
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  public tieneRol(nombreRol: string): boolean {
    return this.roles.some(rol => rol.activo && rol.nombre === nombreRol);
  }

  /**
   * Verifica si el usuario es administrador
   */
  public esAdmin(): boolean {
    return this.tieneRol("ADMIN") || this.tieneRol("Administrador");
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  public puede(permiso: string): boolean {
    if (this.esAdmin()) return true;
    return this.roles.some(rol => rol.activo && rol.permisos.includes(permiso));
  }

  /**
   * Valida si el usuario puede operar en el sistema
   */
  public validarEstadoOperacional(): void {
    if (!this.activo) throw new Error("Usuario inactivo");
    if (this.cuentaBloqueada) throw new Error("Cuenta bloqueada");
    if (!this.emailVerificado) throw new Error("Email no verificado");
  }

  public toJSON(): IUsuario {
      return { ...this };
  }

  public static fromJSON(data: any): Usuario {
      return new Usuario({
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          fechaUltimoAcceso: data.fechaUltimoAcceso ? new Date(data.fechaUltimoAcceso) : undefined,
          fechaBloqueo: data.fechaBloqueo ? new Date(data.fechaBloqueo) : undefined
      });
  }
}

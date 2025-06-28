// src/services/userService.ts
import prisma from '../prisma/client';

export const getAllUsers = async () => {
  return await prisma.user.findMany();
};

export const getUserById = async (id: number) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};

export const createUser = async (name: string, email: string , password: string , companyName: string) => {
  console.log('password' , password);//ok
  return await prisma.user.create({
    data: { name: name, email:email , password:password }
  });
};

export const updateUser = async (id: number, name: string, email: string) => {
  return await prisma.user.update({
    where: { id },
    data: { name, email },
  });
};

export const deleteUser = async (id: number) => {
  return await prisma.user.delete({
    where: { id },
  });
};

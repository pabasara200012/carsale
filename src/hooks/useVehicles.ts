// Hook to provide data services using Firebase
import { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { db } from '../services/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc, addDoc } from 'firebase/firestore';

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      console.log('Loading vehicles from Firebase');
      
      const vehiclesCollection = collection(db, 'vehicles');
      const querySnapshot = await getDocs(vehiclesCollection);
      const vehiclesList: Vehicle[] = [];
      
      querySnapshot.forEach((doc) => {
        const vehicleData = doc.data();
        vehiclesList.push({ ...vehicleData, id: doc.id } as Vehicle);
      });

      setVehicles(vehiclesList);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Adding vehicle to Firebase');
      const vehiclesCollection = collection(db, 'vehicles');
      const docRef = await addDoc(vehiclesCollection, {
        ...vehicleData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const newVehicle = {
        id: docRef.id,
        ...vehicleData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Vehicle;
      
      setVehicles(prev => [...prev, newVehicle]);
      return docRef.id;
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  };

  const updateVehicle = async (vehicleId: string, updates: Partial<Vehicle>) => {
    try {
      console.log('Updating vehicle in Firebase');
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      await updateDoc(vehicleRef, {
        ...updates,
        updatedAt: new Date()
      });
      
      setVehicles(prev => 
        prev.map(vehicle => 
          vehicle.id === vehicleId 
            ? { ...vehicle, ...updates, updatedAt: new Date() }
            : vehicle
        )
      );
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  };

  const deleteVehicle = async (vehicleId: string) => {
    try {
      console.log('Deleting vehicle from Firebase');
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      await deleteDoc(vehicleRef);
      
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== vehicleId));
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  };

  const getVehicle = async (vehicleId: string): Promise<Vehicle | null> => {
    try {
      console.log('Getting vehicle from Firebase');
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      const docSnap = await getDoc(vehicleRef);
      
      if (docSnap.exists()) {
        const vehicleData = docSnap.data();
        return { ...vehicleData, id: docSnap.id } as Vehicle;
      }
      return null;
    } catch (error) {
      console.error('Error getting vehicle:', error);
      return null;
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  return {
    vehicles,
    loading,
    loadVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicle
  };
};
